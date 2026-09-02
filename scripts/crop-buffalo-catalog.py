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
    spread = arr.max(axis=2).astype(int) - arr.min(axis=2).astype(int)
    non_bg = (gray < bg_thresh) | (spread > 5)
    return non_bg & ~banner_mask(arr)


def product_bbox(im: Image.Image, bg_thresh: int = 246):
    arr = arr_rgb(im)
    mask = product_mask(arr, bg_thresh)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    pad = max(6, int(min(im.width, im.height) * 0.04))
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


def edge_background_mask(arr: np.ndarray, tolerance: float = 42) -> np.ndarray:
    h, w, _ = arr.shape
    samples = []
    step = max(1, min(w, h) // 36)
    for x in range(0, w, step):
        samples.append(arr[0, x])
        samples.append(arr[h - 1, x])
    for y in range(0, h, step):
        samples.append(arr[y, 0])
        samples.append(arr[y, w - 1])
    bg = np.median(samples, axis=0)
    dist = np.sqrt(((arr.astype(float) - bg) ** 2).sum(axis=2))
    return dist < tolerance


def trim_cell_left_border(cell: Image.Image) -> Image.Image:
    arr = arr_rgb(cell)
    h, w = arr.shape[:2]
    gray = arr.mean(axis=2)
    cut = 0
    for x in range(0, min(int(w * 0.25), w - 1)):
        col = gray[:, x]
        if (col < 95).mean() > 0.35:
            cut = x + 1
    if cut > 0:
        cell = cell.crop((cut, 0, w, h))
    return cell


def flatten_to_white(im: Image.Image) -> Image.Image:
    """Composite product on pure white — catalog pages or standalone photos."""
    arr = arr_rgb(im)
    white_frac = (arr.mean(axis=2) > 247).mean()
    blue_frac = (arr[:, :, 2] > arr[:, :, 0] + 15).mean()
    if white_frac > 0.5 and blue_frac < 0.08:
        mask = product_mask(arr, bg_thresh=247)
    elif blue_frac > 0.08:
        blue_bg = (arr[:, :, 2] > arr[:, :, 0] + 10) & (arr[:, :, 2] > 70)
        bg = blue_bg | edge_background_mask(arr, 34)
        mask = ~bg & (arr.mean(axis=2) < 250)
        mask &= ~banner_mask(arr)
    else:
        mask = ~edge_background_mask(arr, 38) & (arr.mean(axis=2) < 252)
        mask &= ~banner_mask(arr)
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


def trim_cell_right_border(cell: Image.Image) -> Image.Image:
    """Remove catalog column divider bleeding into forja photo cells."""
    arr = arr_rgb(cell)
    h, w = arr.shape[:2]
    gray = arr.mean(axis=2)
    cut = w
    for x in range(w - 1, max(int(w * 0.45), 1), -1):
        col = gray[:, x]
        if (col < 95).mean() > 0.35:
            cut = x
            break
    if cut < w:
        cell = cell.crop((0, 0, max(1, cut - 2), h))
    return cell


def detect_forja_rows(im: Image.Image, expected: int) -> list[tuple[int, int]]:
    arr = arr_rgb(im)
    h, w = arr.shape[:2]
    gray = arr.mean(axis=2)
    header = int(h * 0.045)
    body_end = int(h * 0.985)
    separators: list[int] = []
    for y in range(header + 2, body_end - 2):
        row = gray[y]
        if (row < 105).mean() > 0.28:
            separators.append(y)
    if not separators:
        body_h = body_end - header
        row_h = body_h / expected
        return [(int(header + i * row_h), int(header + (i + 1) * row_h)) for i in range(expected)]

    groups: list[list[int]] = []
    current = [separators[0]]
    for y in separators[1:]:
        if y - current[-1] <= 4:
            current.append(y)
        else:
            groups.append(current)
            current = [y]
    groups.append(current)
    bounds = [header] + [int(np.mean(g)) for g in groups] + [body_end]
    bands: list[tuple[int, int]] = []
    for i in range(len(bounds) - 1):
        y0, y1 = bounds[i], bounds[i + 1]
        if y1 - y0 > 36:
            bands.append((y0, y1))
    if len(bands) > expected:
        bands = bands[:expected]
    elif len(bands) < expected:
        body_h = body_end - header
        row_h = body_h / expected
        bands = [(int(header + i * row_h), int(header + (i + 1) * row_h)) for i in range(expected)]
    return bands


def crop_forja_row(im: Image.Image, row_box: tuple[int, int]) -> Image.Image:
    w, _ = im.size
    y0, y1 = row_box
    row = im.crop((0, y0, w, y1))
    img_w = int(w * 0.21)
    cell = row.crop((0, 0, img_w, row.height))
    cell = trim_table_lines(cell)
    cell = trim_cell_left_border(cell)
    cell = trim_cell_right_border(cell)
    bbox = product_bbox(cell, bg_thresh=242)
    crop = cell.crop(bbox) if bbox else cell
    return center_on_studio_canvas(crop)


def to_studio_shot(im: Image.Image) -> Image.Image:
    return center_on_studio_canvas(im)


def crop_standalone_photos() -> dict[str, str]:
    """Normalize tornillo / esponja product photos onto white studio canvases."""
    paths: dict[str, str] = {}
    for subdir in ('tornillos', 'accesorios'):
        folder = PRODUCTS_DIR / subdir
        if not folder.exists():
            continue
        for photo in sorted(folder.glob('*.jpeg')):
            crop = to_studio_shot(Image.open(photo))
            rel = save_crop(crop, photo.stem)
            paths[f'{subdir}/{photo.name}'] = rel
            print(f'  Photo {subdir}/{photo.name}: {crop.size}')
    return paths


def is_header_row(row: np.ndarray) -> bool:
    headerish = (
        (row[:, 0] > 120) & (row[:, 0] < 210) &
        (row[:, 1] > 140) & (row[:, 1] < 220) &
        (row[:, 2] > 160) & (row[:, 2] < 240)
    )
    return headerish.mean() > 0.35


def major_table_starts(im: Image.Image, expected: int = 1) -> list[int]:
    arr = arr_rgb(im)
    h, _ = arr.shape[:2]
    starts: list[int] = []
    in_header = False
    for y in range(h):
        is_header = is_header_row(arr[y])
        if is_header and not in_header:
            starts.append(y)
            in_header = True
        elif not is_header:
            in_header = False
    min_gap = max(70, int(h / max(expected, 1) * 0.45))
    filtered: list[int] = []
    for y in starts:
        if not filtered or y - filtered[-1] > min_gap:
            filtered.append(y)
    return filtered


def table_bottom(im: Image.Image, header_y: int, max_scan: int = 120) -> int:
    arr = arr_rgb(im)
    h = arr.shape[0]
    end_y = min(h, header_y + max_scan)
    if end_y <= header_y:
        return header_y + 10
    gray = arr[header_y:end_y].mean(axis=(1, 2))
    last_table_row = 0
    white_streak = 0
    for i, value in enumerate(gray):
        if float(value) < 245:
            last_table_row = i
            white_streak = 0
        else:
            white_streak += 1
            if white_streak >= 6 and last_table_row > 0:
                break
    return min(h, header_y + last_table_row + 8)


def pvc_photo_zones(im: Image.Image, expected: int) -> list[tuple[int, int]]:
    tables = major_table_starts(im, expected)
    h = im.height
    zones: list[tuple[int, int]] = []

    if len(tables) >= expected:
        for i in range(expected):
            y1 = tables[i] - 8
            if i == 0:
                y0 = 0
            else:
                prev_end = table_bottom(im, tables[i - 1])
                y0 = max(prev_end + 4, y1 - int(h * 0.14))
            zones.append((y0, y1))
        return zones

    # Fallback for unusual layouts: equal page slices, photo strip above local header.
    for idx in range(expected):
        y0 = int(h * idx / expected)
        y1 = int(h * (idx + 1) / expected)
        section = im.crop((0, y0, im.width, y1))
        local_tables = major_table_starts(section, 1)
        if local_tables:
            strip_h = max(24, local_tables[0] - 8)
            zones.append((y0, y0 + strip_h))
        else:
            zones.append((y0, y0 + max(24, int((y1 - y0) * 0.2))))
    return zones


def crop_pvc_photo_zone(im: Image.Image, zone: tuple[int, int]) -> Image.Image:
    w, _ = im.size
    y0, y1 = zone
    strip = im.crop((int(w * 0.08), y0, int(w * 0.92), y1))
    strip = trim_table_lines(strip)
    bbox = product_bbox(strip, bg_thresh=244)
    crop = strip.crop(bbox) if bbox else strip
    return center_on_studio_canvas(crop)


def crop_pvc_section(im: Image.Image, section_idx: int, section_count: int) -> Image.Image:
    zones = pvc_photo_zones(im, section_count)
    if section_idx < len(zones):
        return crop_pvc_photo_zone(im, zones[section_idx])
    w, h = im.size
    y0 = int(h * section_idx / section_count)
    y1 = int(h * (section_idx + 1) / section_count)
    return crop_pvc_photo_zone(im, (y0, y0 + max(24, int((y1 - y0) * 0.2))))


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

    print('Normalizing tornillo and accesorio photos...')
    photo_studio = crop_standalone_photos()

    for p in items:
        gid = p['group_id']
        if gid in group_studio:
            p['studio_image'] = group_studio[gid]
            p['image'] = group_studio[gid]
        elif p['code'] in code_studio:
            p['studio_image'] = code_studio[p['code']]
            p['image'] = code_studio[p['code']]
        else:
            page_img = p.get('image', '')
            if page_img.startswith('catalog/products/'):
                rel = page_img.replace('catalog/products/', '')
                if rel in photo_studio:
                    p['studio_image'] = photo_studio[rel]
                    p['image'] = photo_studio[rel]

    JSON_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(
        f'Updated {JSON_PATH.name} with {len(group_studio)} PVC, '
        f'{len(code_studio)} forja and {len(photo_studio)} standalone crops'
    )


if __name__ == '__main__':
    main()
