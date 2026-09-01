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
        'code_pattern': re.compile(r'([A-Z]{2,3}-\d{2,4}[A-Z0-9-]*)'),
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


def enhance_image(im: Image.Image, min_width: int) -> Image.Image:
    im = im.convert('RGB')
    if im.width < min_width:
        scale = min_width / im.width
        im = im.resize((min_width, max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))


def save_jpeg(im: Image.Image, out_path: Path, quality: int):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, format='JPEG', quality=quality, optimize=True)


def crop_page_region(page, bbox, out_path: Path, scale: float, quality: int, min_width: int):
    clip = pymupdf.Rect(bbox)
    matrix = pymupdf.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
    im = Image.open(io.BytesIO(pix.tobytes('jpeg')))
    save_jpeg(enhance_image(im, min_width), out_path, quality)


def save_native_image(doc, xref: int, out_path: Path, quality: int, min_width: int) -> bool:
    try:
        info = doc.extract_image(xref)
    except Exception:
        return False
    try:
        im = Image.open(io.BytesIO(info['image']))
    except Exception:
        return False
    save_jpeg(enhance_image(im, min_width), out_path, quality)
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
                if isinstance(match, dict) and match.get('xref'):
                    image_bbox = match['bbox']
                    if save_native_image(doc, match['xref'], out_path, cfg['jpg_quality'], cfg['min_width']):
                        native += 1
                        product['image'] = rel_path
                        continue
                else:
                    image_bbox = match if isinstance(match, (list, tuple)) else match['bbox']
            else:
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
        f'({native} native, {matched - native} rendered, {fallback} fallback, {len(missing)} missing)'
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
