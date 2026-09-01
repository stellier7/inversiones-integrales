#!/usr/bin/env python3
"""Crop per-product images from Lumiart and Celima catalog PDFs."""
from __future__ import annotations

import io
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pymupdf
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / 'scripts' / 'extracted'

BRANDS = {
    'celima': {
        'pdf': ROOT / 'celima/assets/images/catalog/Catalogo-Celima-Ferreteria-El-Jordan.pdf',
        'json': EXTRACTED / 'celima-products.json',
        'out_dir': ROOT / 'celima/assets/images/catalog/products',
        'code_pattern': re.compile(r'\b(\d{5})\b'),
        'filename': lambda code: f'{code}.jpeg',
        'min_img_area': 6000,
        'scale': 4.0,
        'jpg_quality': 92,
        'min_width': 320,
    },
    'lumiart': {
        'pdf': ROOT / 'lumiart/assets/images/catalog/El Jordan Catalogo sin Logos_compressed.pdf',
        'json': EXTRACTED / 'lumiart-products.json',
        'out_dir': ROOT / 'lumiart/assets/images/catalog/products',
        'code_pattern': re.compile(r'((?:DI|FAN|BFC\d*|BG9|BGU10|TPF|LIN|LDP|PRO|OTD)-[A-Z0-9-]+)'),
        'filename': lambda code: re.sub(r'[^\w.-]+', '-', code) + '.jpeg',
        'min_img_area': 5000,
        'scale': 5.0,
        'jpg_quality': 92,
        'min_width': 400,
    },
}


def bbox_center(bb):
    return ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)


def bbox_area(bb):
    return max(0, bb[2] - bb[0]) * max(0, bb[3] - bb[1])


def is_valid_product_image(bb, page_rect, min_area):
    width = bb[2] - bb[0]
    height = bb[3] - bb[1]
    if width < 35 or height < 35:
        return False
    if bbox_area(bb) < min_area:
        return False
    if bbox_area(bb) > page_rect.width * page_rect.height * 0.45:
        return False
    return True


def find_codes_on_page(page, code_pattern):
    by_code = {}
    for block in page.get_text('dict')['blocks']:
        if block.get('type') != 0:
            continue
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans']).strip()
            match = code_pattern.search(text)
            if not match:
                continue
            code = match.group(1) if match.lastindex else match.group(0)
            prev = by_code.get(code)
            if not prev or block['bbox'][1] > prev['bbox'][1]:
                by_code[code] = block['bbox']
    return by_code


def product_images_on_page(page, min_area):
    images = []
    for block in page.get_text('dict')['blocks']:
        if block.get('type') != 1:
            continue
        bbox = block['bbox']
        if is_valid_product_image(bbox, page.rect, min_area):
            images.append(bbox)
    return images


def page_image_infos(page, min_area):
    infos = []
    for info in page.get_image_info(xrefs=True):
        xref = info.get('xref') or 0
        if not xref:
            continue
        bb = info['bbox']
        if not is_valid_product_image(bb, page.rect, min_area):
            continue
        infos.append({
            'bbox': bb,
            'xref': xref,
            'width': info['width'],
            'height': info['height'],
        })
    return infos


def match_code_to_bbox(code_bbox, candidates):
    _, cy = bbox_center(code_bbox)
    best = None
    best_score = float('inf')
    for item in candidates:
        image_bbox = item if isinstance(item, (list, tuple)) else item['bbox']
        ix, _ = bbox_center(image_bbox)
        cx, _ = bbox_center(code_bbox)
        if image_bbox[3] > cy + 30:
            continue
        hdist = abs(ix - cx)
        vdist = cy - image_bbox[3]
        if vdist < -10:
            continue
        overlap = max(0, min(code_bbox[2], image_bbox[2]) - max(code_bbox[0], image_bbox[0]))
        score = hdist * 2 + max(0, vdist) * 0.3 - overlap * 0.5
        if score < best_score:
            best_score = score
            best = item
    return best


def fallback_crop_bbox(code_bbox, page_rect, brand):
    cx, _ = bbox_center(code_bbox)
    if brand == 'celima':
        width, height = 155, 145
    else:
        width, height = 150, 220
    x0 = max(16, cx - width / 2)
    x1 = min(page_rect.width - 16, cx + width / 2)
    y1 = code_bbox[1] - 8
    y0 = max(36, y1 - height)
    return (x0, y0, x1, y1)


def pad_bbox(bbox, page_rect, pad=4):
    x0, y0, x1, y1 = bbox
    return (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(page_rect.width, x1 + pad),
        min(page_rect.height, y1 + pad),
    )


def dark_pixel_ratio(im: Image.Image, threshold: int = 40) -> float:
    gray = im.convert('L')
    hist = gray.histogram()
    dark = sum(hist[:threshold])
    return dark / max(1, sum(hist))


def normalize_on_white(im: Image.Image, min_width: int) -> Image.Image:
    """Trim PDF dark letterboxing and composite the product on a white well."""
    from PIL import ImageDraw

    im = im.convert('RGB')
    w, h = im.size
    seeds = {(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)}
    step_x = max(1, w // 24)
    step_y = max(1, h // 24)
    for x in range(0, w, step_x):
        seeds.add((x, 0))
        seeds.add((x, h - 1))
    for y in range(0, h, step_y):
        seeds.add((0, y))
        seeds.add((w - 1, y))

    for seed in seeds:
        try:
            if sum(im.getpixel(seed)) / 3 < 210:
                ImageDraw.floodfill(im, seed, (255, 255, 255), thresh=48)
        except Exception:
            pass

    gray = im.convert('L')
    bbox = gray.point(lambda x: 255 if x > 245 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)

    pad = max(8, int(max(im.width, im.height) * 0.06))
    canvas = Image.new('RGB', (im.width + pad * 2, im.height + pad * 2), (255, 255, 255))
    canvas.paste(im, (pad, pad))
    im = canvas

    if im.width < min_width:
        scale = min_width / im.width
        im = im.resize((min_width, max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))


def enhance_image(im: Image.Image, min_width: int) -> Image.Image:
    return normalize_on_white(im, min_width)


def load_native_image(doc, xref: int) -> Image.Image | None:
    try:
        info = doc.extract_image(xref)
    except Exception:
        return None
    try:
        return Image.open(io.BytesIO(info['image']))
    except Exception:
        return None


def render_page_crop(page, bbox, scale: float) -> Image.Image:
    clip = pymupdf.Rect(bbox)
    matrix = pymupdf.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
    return Image.open(io.BytesIO(pix.tobytes('jpeg')))


def pick_best_crop(native_im: Image.Image | None, render_im: Image.Image | None, min_width: int) -> Image.Image:
    candidates = []
    for source, im in (('native', native_im), ('render', render_im)):
        if im is None:
            continue
        enhanced = enhance_image(im, min_width)
        candidates.append((dark_pixel_ratio(enhanced), source, enhanced))
    if not candidates:
        raise ValueError('no image candidates')
    candidates.sort(key=lambda item: item[0])
    return candidates[0][2]


def save_jpeg(im: Image.Image, out_path: Path, quality: int):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, format='JPEG', quality=quality, optimize=True)


def crop_page_region(page, bbox, out_path: Path, scale: float, quality: int, min_width: int):
    clip = pymupdf.Rect(bbox)
    matrix = pymupdf.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
    im = Image.open(io.BytesIO(pix.tobytes('jpeg')))
    save_jpeg(enhance_image(im, min_width), out_path, quality)


def save_product_image(
    out_path: Path,
    quality: int,
    min_width: int,
    native_im: Image.Image | None = None,
    render_im: Image.Image | None = None,
) -> bool:
    try:
        im = pick_best_crop(native_im, render_im, min_width)
    except ValueError:
        return False
    save_jpeg(im, out_path, quality)
    return True


def process_brand(brand_key: str):
    cfg = BRANDS[brand_key]
    items = json.loads(cfg['json'].read_text(encoding='utf-8'))
    doc = pymupdf.open(cfg['pdf'])
    by_page = defaultdict(list)
    for product in items:
        by_page[product['page']].append(product)

    matched = 0
    native = 0
    rendered = 0
    fallback = 0
    missing = []

    for page_num, products in sorted(by_page.items()):
        if page_num >= len(doc):
            for product in products:
                missing.append(product['code'])
            continue

        page = doc[page_num]
        codes = find_codes_on_page(page, cfg['code_pattern'])
        block_images = product_images_on_page(page, cfg['min_img_area'])
        xref_images = page_image_infos(page, cfg['min_img_area']) if brand_key == 'lumiart' else []

        candidates = xref_images or block_images

        for product in products:
            code = product['code']
            code_bbox = codes.get(code)
            rel_path = f"catalog/products/{cfg['filename'](code)}"
            out_path = cfg['out_dir'] / cfg['filename'](code)

            if not code_bbox:
                missing.append(code)
                continue

            match = match_code_to_bbox(code_bbox, candidates)
            if match:
                matched += 1
                image_bbox = match['bbox'] if isinstance(match, dict) else match
                native_im = None
                if isinstance(match, dict) and match.get('xref'):
                    native_im = load_native_image(doc, match['xref'])
                render_im = render_page_crop(
                    page,
                    pad_bbox(image_bbox, page.rect),
                    cfg['scale'],
                )
                if native_im is not None:
                    if save_product_image(
                        out_path,
                        cfg['jpg_quality'],
                        cfg['min_width'],
                        native_im=native_im,
                        render_im=render_im,
                    ):
                        native += 1
                        product['image'] = rel_path
                        continue
                save_jpeg(enhance_image(render_im, cfg['min_width']), out_path, cfg['jpg_quality'])
                rendered += 1
                product['image'] = rel_path
                continue

            image_bbox = fallback_crop_bbox(code_bbox, page.rect, brand_key)
            fallback += 1
            crop_page_region(
                page,
                pad_bbox(image_bbox, page.rect),
                out_path,
                cfg['scale'],
                cfg['jpg_quality'],
                cfg['min_width'],
            )
            product['image'] = rel_path

    doc.close()
    cfg['json'].write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(
        f'{brand_key}: saved {matched + fallback}/{len(items)} '
        f'({native} native+render pick, {rendered} rendered, {fallback} fallback, {len(missing)} missing)'
    )
    if missing:
        print('  missing codes:', ', '.join(missing[:20]))


def main():
    brands = sys.argv[1:] if len(sys.argv) > 1 else list(BRANDS)
    for brand in brands:
        if brand not in BRANDS:
            print(f'Unknown brand: {brand}')
            continue
        process_brand(brand)


if __name__ == '__main__':
    main()
