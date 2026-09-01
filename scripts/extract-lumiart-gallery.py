#!/usr/bin/env python3
"""Extract showroom lifestyle images from the Lumiart PDF for the homepage gallery."""
from __future__ import annotations

import json
from pathlib import Path

import pymupdf
from PIL import Image
import io

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'lumiart/assets/images/catalog/El Jordan Catalogo sin Logos_compressed.pdf'
OUT_DIR = ROOT / 'lumiart/assets/images/gallery'
MANIFEST = ROOT / 'scripts/extracted/lumiart-gallery.json'

# Optional manual xref overrides when auto-pick fails (page index -> xref)
GALLERY_XREF_OVERRIDES = {
    5: 284,
}

GALLERY_PAGES = [
    (4, 'Ambiente iluminado'),
    (12, 'Sala contemporánea'),
    (16, 'Comedor elegante'),
    (19, 'Detalle de iluminación'),
    (5, 'Dormitorio moderno'),
    (1, 'Lámparas Smart'),
]


def bbox_area(bb):
    return max(0, bb[2] - bb[0]) * max(0, bb[3] - bb[1])


def pick_best_image(page, page_rect):
    best = None
    for info in page.get_image_info(xrefs=True):
        xref = info.get('xref') or 0
        if not xref:
            continue
        w, h = info['width'], info['height']
        if w < 180 or h < 180:
            continue
        bb = info['bbox']
        if bbox_area(bb) < page_rect.width * page_rect.height * 0.08:
            continue
        # skip full-bleed backgrounds that are mostly off-page
        visible_x0 = max(bb[0], 0)
        visible_x1 = min(bb[2], page_rect.width)
        visible_y0 = max(bb[1], 0)
        visible_y1 = min(bb[3], page_rect.height)
        visible_area = max(0, visible_x1 - visible_x0) * max(0, visible_y1 - visible_y0)
        if visible_area < page_rect.width * page_rect.height * 0.12:
            continue
        score = w * h
        if not best or score > best[0]:
            best = (score, xref, w, h)
    return best


def save_image_bytes(data: bytes, ext: str, out_path: Path, min_width: int = 900):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if ext in ('jpeg', 'jpg'):
        im = Image.open(io.BytesIO(data)).convert('RGB')
    else:
        im = Image.open(io.BytesIO(data)).convert('RGB')
    if im.width < min_width:
        scale = min_width / im.width
        im = im.resize((min_width, int(im.height * scale)), Image.Resampling.LANCZOS)
    im.save(out_path, format='JPEG', quality=90, optimize=True)


def main():
    doc = pymupdf.open(PDF)
    items = []
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for page_num, caption in GALLERY_PAGES:
        if page_num >= len(doc):
            continue
        page = doc[page_num]
        override_xref = GALLERY_XREF_OVERRIDES.get(page_num)
        if override_xref:
            info = doc.extract_image(override_xref)
            fname = f'gallery-{page_num:02d}.jpeg'
            out_path = OUT_DIR / fname
            save_image_bytes(info['image'], info['ext'], out_path)
            items.append({
                'type': 'image',
                'src': f'assets/images/gallery/{fname}',
                'caption': caption,
            })
            print(f'page {page_num}: override xref {override_xref} -> {fname}')
            continue

        picked = pick_best_image(page, page.rect)
        if not picked:
            # high-res render fallback
            pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False)
            fname = f'gallery-{page_num:02d}.jpeg'
            pix.save(str(OUT_DIR / fname), output='jpeg', jpg_quality=90)
            items.append({
                'type': 'image',
                'src': f'assets/images/gallery/{fname}',
                'caption': caption,
            })
            continue

        _, xref, w, h = picked
        info = doc.extract_image(xref)
        fname = f'gallery-{page_num:02d}.jpeg'
        out_path = OUT_DIR / fname
        save_image_bytes(info['image'], info['ext'], out_path)
        items.append({
            'type': 'image',
            'src': f'assets/images/gallery/{fname}',
            'caption': caption,
        })
        print(f'page {page_num}: {w}x{h} -> {fname}')

    doc.close()
    MANIFEST.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {len(items)} gallery images')


if __name__ == '__main__':
    main()
