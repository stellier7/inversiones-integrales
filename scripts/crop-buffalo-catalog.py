#!/usr/bin/env python3
"""Crop studio product shots from Buffalo catalog page JPEGs."""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'scripts/extracted/buffalo-products.json'
PRODUCTS_DIR = ROOT / 'buffalo/assets/images/catalog/products'
CROPS_DIR = PRODUCTS_DIR / 'crops'

# (page relative path, group_id, section_index, section_count)
PVC_SECTIONS = [
    ('pvc/IMG_0477.jpeg', 'dwv-codos', 0, 3),
    ('pvc/IMG_0477.jpeg', 'dwv-tees', 1, 3),
    ('pvc/IMG_0477.jpeg', 'dwv-yees', 2, 3),
    ('pvc/IMG_0478.jpeg', 'bujes-presion', 0, 1),
    ('pvc/IMG_0479.jpeg', 'abrazaderas', 0, 2),
    ('pvc/IMG_0479.jpeg', 'adaptadores-macho', 1, 2),
    ('pvc/IMG_0480.jpeg', 'adaptadores-hembra', 0, 2),
    ('pvc/IMG_0480.jpeg', 'codos-presion', 1, 2),
    ('pvc/IMG_0481.jpeg', 'tees-presion', 0, 3),
    ('pvc/IMG_0481.jpeg', 'tapones', 1, 3),
    ('pvc/IMG_0481.jpeg', 'uniones-lisas', 2, 3),
    ('pvc/IMG_0482.jpeg', 'bujes-dwv', 0, 4),
    ('pvc/IMG_0482.jpeg', 'uniones-drenaje', 1, 4),
    ('pvc/IMG_0482.jpeg', 'uniones-compresion', 2, 4),
    ('pvc/IMG_0482.jpeg', 'uniones-universales', 3, 4),
    ('pvc/IMG_0483.jpeg', 'valvulas-bola', 0, 3),
    ('pvc/IMG_0483.jpeg', 'trampas-sifones', 1, 3),
    ('pvc/IMG_0483.jpeg', 'accesorios-cpvc', 2, 3),
]

FORJA_PAGES = {
    'forjas/IMG_0501.jpeg': 9,
    'forjas/IMG_0502.jpeg': 10,
    'forjas/IMG_0503.jpeg': 10,
    'forjas/IMG_0504.jpeg': 10,
    'forjas/IMG_0505.jpeg': 12,
    'forjas/IMG_0506.jpeg': 10,
    'forjas/IMG_0507.jpeg': 10,
}


def normalize_on_white(im: Image.Image, min_width: int = 320) -> Image.Image:
    im = im.convert('RGB')
    w, h = im.size
    seeds = {(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)}
    for x in range(0, w, max(1, w // 24)):
        seeds.add((x, 0))
        seeds.add((x, h - 1))
    for y in range(0, h, max(1, h // 24)):
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
    pad = max(8, int(max(im.width, im.height) * 0.08))
    canvas = Image.new('RGB', (im.width + pad * 2, im.height + pad * 2), (255, 255, 255))
    canvas.paste(im, (pad, pad))
    im = canvas
    if im.width < min_width:
        scale = min_width / im.width
        im = im.resize((min_width, max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))


def content_bbox(section: Image.Image, thresh: int = 248):
    arr = np.array(section.convert('RGB'))
    mask = (arr[:, :, 0] < thresh) | (arr[:, :, 1] < thresh) | (arr[:, :, 2] < thresh)
    blue = (arr[:, :, 2] > 180) & (arr[:, :, 0] < 120) & (arr[:, :, 1] > 100)
    yellow = (arr[:, :, 0] > 170) & (arr[:, :, 1] > 170) & (arr[:, :, 2] < 140)
    mask = mask & ~blue & ~yellow
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    pad = 10
    return (
        max(0, int(xs.min()) - pad),
        max(0, int(ys.min()) - pad),
        min(section.width, int(xs.max()) + pad),
        min(section.height, int(ys.max()) + pad),
    )


def crop_pvc_section(im: Image.Image, section_idx: int, section_count: int) -> Image.Image:
    w, h = im.size
    if section_count == 1:
        top_frac = 0.22
        section = im.crop((int(w * 0.08), 0, int(w * 0.92), int(h * top_frac)))
    else:
        y0 = int(h * section_idx / section_count)
        y1 = int(h * (section_idx + 1) / section_count)
        section = im.crop((0, y0, w, y1))
        crop_h = int(section.height * 0.38)
        margin = int(w * 0.12)
        section = section.crop((margin, 0, w - margin, crop_h))
    bb = content_bbox(section)
    crop = section.crop(bb) if bb else section
    return normalize_on_white(crop, 360)


def crop_forja_row(im: Image.Image, row_idx: int, row_count: int) -> Image.Image:
    w, h = im.size
    header = int(h * 0.055)
    body = im.crop((0, header, w, h))
    row_h = body.height / row_count
    y0 = int(row_idx * row_h)
    y1 = int((row_idx + 1) * row_h)
    row = body.crop((0, y0, w, y1))
    img_w = int(w * 0.22)
    cell = row.crop((0, 0, img_w, row.height))
    return normalize_on_white(cell, 240)


def save_crop(im: Image.Image, name: str) -> str:
    CROPS_DIR.mkdir(parents=True, exist_ok=True)
    rel = f'catalog/products/crops/{name}.jpeg'
    im.save(PRODUCTS_DIR / 'crops' / f'{name}.jpeg', format='JPEG', quality=92, optimize=True)
    return rel


def crop_pvc_groups():
    studio = {}
    for page_rel, group_id, idx, total in PVC_SECTIONS:
        page_path = PRODUCTS_DIR / page_rel
        if not page_path.exists():
            print(f'Missing page: {page_rel}')
            continue
        im = Image.open(page_path)
        crop = crop_pvc_section(im, idx, total)
        studio[group_id] = save_crop(crop, group_id)
        print(f'  PVC {group_id}: {crop.size}')
    return studio


def crop_forja_products(products):
    by_page = {}
    for p in products:
        page = p.get('page_image', '')
        if page in FORJA_PAGES or page.startswith('forjas/'):
            by_page.setdefault(page, []).append(p)

    paths = {}
    for page_rel, row_count in FORJA_PAGES.items():
        page_path = PRODUCTS_DIR / page_rel
        if not page_path.exists():
            continue
        im = Image.open(page_path)
        page_products = by_page.get(page_rel, [])
        page_products.sort(key=lambda x: x['code'])
        # Preserve extraction order from JSON file instead of sorting by code
        page_products = [p for p in products if p.get('page_image') == page_rel]
        for i, product in enumerate(page_products):
            if i >= row_count:
                break
            code = product['code'].lower().replace('/', '-')
            crop = crop_forja_row(im, i, row_count)
            paths[product['code']] = save_crop(crop, code)
            print(f'  Forja {product["code"]}: {crop.size}')
    return paths


def main():
    items = json.loads(JSON_PATH.read_text(encoding='utf-8'))

    # Tag page_image on items for forja cropping order
    page_groups = {}
    for p in items:
        img = p.get('image', '')
        if '/forjas/' in img:
            page = img.split('catalog/products/')[-1] if 'catalog/products/' in img else img
            p['page_image'] = page
            page_groups.setdefault(page, []).append(p)

    print('Cropping PVC section studio shots...')
    group_studio = crop_pvc_groups()

    print('Cropping forja / herraje row shots...')
    code_studio = crop_forja_products(items)

    for p in items:
        gid = p['group_id']
        if gid in group_studio:
            p['studio_image'] = group_studio[gid]
            p['image'] = group_studio[gid]
        elif p['code'] in code_studio:
            p['studio_image'] = code_studio[p['code']]
            p['image'] = code_studio[p['code']]
        # tornillos / accesorios keep their photo paths

    JSON_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Updated {JSON_PATH.name} with {len(group_studio)} PVC crops and {len(code_studio)} row crops')


if __name__ == '__main__':
    main()
