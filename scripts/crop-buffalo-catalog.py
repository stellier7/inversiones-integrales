#!/usr/bin/env python3
"""Crop centered studio product shots from Buffalo catalog page JPEGs."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'scripts/extracted/buffalo-products.json'
PRODUCTS_DIR = ROOT / 'buffalo/assets/images/catalog/products'
CROPS_DIR = PRODUCTS_DIR / 'crops'

STUDIO_SIZE = 800
STUDIO_PAD = 0.12

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


def arr_rgb(im: Image.Image) -> np.ndarray:
    return np.array(im.convert('RGB'))


def banner_mask(arr: np.ndarray) -> np.ndarray:
    blue = (arr[:, :, 2] > 180) & (arr[:, :, 0] < 120) & (arr[:, :, 1] > 100)
    yellow = (arr[:, :, 0] > 170) & (arr[:, :, 1] > 170) & (arr[:, :, 2] < 140)
    return blue | yellow


def product_mask(arr: np.ndarray, bg_thresh: int = 246) -> np.ndarray:
    gray = arr.mean(axis=2)
    non_bg = gray < bg_thresh
    return non_bg & ~banner_mask(arr)


def product_bbox(im: Image.Image, bg_thresh: int = 246):
    arr = arr_rgb(im)
    mask = product_mask(arr, bg_thresh)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    pad = max(6, int(min(im.width, im.height) * 0.03))
    return (
        max(0, int(xs.min()) - pad),
        max(0, int(ys.min()) - pad),
        min(im.width, int(xs.max()) + pad + 1),
        min(im.height, int(ys.max()) + pad + 1),
    )


def trim_table_lines(im: Image.Image) -> Image.Image:
    """Remove catalog grid lines at the bottom of a row crop."""
    arr = arr_rgb(im)
    h, w = arr.shape[:2]
    gray = arr.mean(axis=2)
    cut = h
    for y in range(h - 1, max(0, h - int(h * 0.35)), -1):
        row = gray[y]
        dark = row < 90
        if dark.mean() > 0.18:
            cut = y
            break
    if cut < h:
        im = im.crop((0, 0, w, max(1, cut - 2)))
    return im


def flatten_to_white(im: Image.Image) -> Image.Image:
    """Composite product on pure white without flood-filling product pixels."""
    arr = arr_rgb(im)
    mask = product_mask(arr, bg_thresh=247)
    white = np.full_like(arr, 255)
    out = np.where(mask[:, :, None], arr, white)
    return Image.fromarray(out.astype(np.uint8))


def center_on_studio_canvas(im: Image.Image, size: int = STUDIO_SIZE) -> Image.Image:
    im = flatten_to_white(im)
    bbox = product_bbox(im)
    if bbox:
        im = im.crop(bbox)
    usable = int(size * (1 - STUDIO_PAD * 2))
    scale = min(usable / im.width, usable / im.height)
    new_w = max(1, int(im.width * scale))
    new_h = max(1, int(im.height * scale))
    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (size, size), (255, 255, 255))
    ox = (size - new_w) // 2
    oy = (size - new_h) // 2
    canvas.paste(im, (ox, oy))
    return canvas.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=3))


def detect_forja_rows(im: Image.Image, expected: int) -> list[tuple[int, int]]:
    arr = arr_rgb(im)
    h, w = arr.shape[:2]
    gray = arr.mean(axis=2)
    header = int(h * 0.05)
    body_end = int(h * 0.985)
    separators = []
    for y in range(header + 4, body_end - 4):
        row = gray[y]
        if (row < 110).mean() > 0.22:
            separators.append(y)
    bands: list[tuple[int, int]] = []
    if not separators:
        body_h = body_end - header
        row_h = body_h / expected
        return [(int(header + i * row_h), int(header + (i + 1) * row_h)) for i in range(expected)]
    groups: list[list[int]] = []
    current = [separators[0]]
    for y in separators[1:]:
        if y - current[-1] <= 3:
            current.append(y)
        else:
            groups.append(current)
            current = [y]
    groups.append(current)
    bounds = [header] + [int(np.mean(g)) for g in groups] + [body_end]
    for i in range(len(bounds) - 1):
        y0, y1 = bounds[i], bounds[i + 1]
        if y1 - y0 > 40:
            bands.append((y0, y1))
    if len(bands) > expected:
        bands = bands[:expected]
    elif len(bands) < expected:
        body_h = body_end - header
        row_h = body_h / expected
        bands = [(int(header + i * row_h), int(header + (i + 1) * row_h)) for i in range(expected)]
    return bands


def crop_pvc_section(im: Image.Image, section_idx: int, section_count: int) -> Image.Image:
    w, h = im.size
    if section_count == 1:
        section = im.crop((int(w * 0.06), 0, int(w * 0.94), int(h * 0.24)))
    else:
        y0 = int(h * section_idx / section_count)
        y1 = int(h * (section_idx + 1) / section_count)
        section = im.crop((0, y0, w, y1))
        photo_h = int(section.height * 0.42)
        margin = int(w * 0.10)
        section = section.crop((margin, 0, w - margin, photo_h))
    section = trim_table_lines(section)
    bbox = product_bbox(section)
    crop = section.crop(bbox) if bbox else section
    return center_on_studio_canvas(crop)


def crop_forja_row(im: Image.Image, row_box: tuple[int, int]) -> Image.Image:
    w, h = im.size
    y0, y1 = row_box
    row = im.crop((0, y0, w, y1))
    img_w = int(w * 0.24)
    cell = row.crop((0, 0, img_w, row.height))
    cell = trim_table_lines(cell)
    bbox = product_bbox(cell, bg_thresh=244)
    crop = cell.crop(bbox) if bbox else cell
    return center_on_studio_canvas(crop)


def save_crop(im: Image.Image, name: str) -> str:
    CROPS_DIR.mkdir(parents=True, exist_ok=True)
    rel = f'catalog/products/crops/{name}.jpeg'
    im.save(PRODUCTS_DIR / 'crops' / f'{name}.jpeg', format='JPEG', quality=94, optimize=True)
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
    paths = {}
    for page_rel, row_count in FORJA_PAGES.items():
        page_path = PRODUCTS_DIR / page_rel
        if not page_path.exists():
            continue
        im = Image.open(page_path)
        row_boxes = detect_forja_rows(im, row_count)
        page_products = [p for p in products if p.get('page_image') == page_rel]
        for i, product in enumerate(page_products):
            if i >= len(row_boxes):
                break
            code = product['code'].lower().replace('/', '-')
            crop = crop_forja_row(im, row_boxes[i])
            paths[product['code']] = save_crop(crop, code)
            print(f'  Forja {product["code"]}: {crop.size}')
    return paths


def main():
    items = json.loads(JSON_PATH.read_text(encoding='utf-8'))

    for p in items:
        img = p.get('image', '')
        if '/forjas/' in img or img.startswith('forjas/'):
            page = img.split('catalog/products/')[-1] if 'catalog/products/' in img else img
            p['page_image'] = page

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

    JSON_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Updated {JSON_PATH.name} with {len(group_studio)} PVC crops and {len(code_studio)} row crops')


if __name__ == '__main__':
    main()
