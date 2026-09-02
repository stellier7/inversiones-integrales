#!/usr/bin/env python3
"""Extract, crop and brand-split the shared Losa Sanitaria catalog PDF."""
from __future__ import annotations

import io
import json
import re
import shutil
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / 'zafiro/assets/images/catalog/products/LOSA SANITARIA 31.08.2026.pdf'
OUT_JSON = ROOT / 'scripts/extracted/losa-sanitaria-products.json'

BRAND_DIRS = {
    'zafiro': ROOT / 'zafiro/assets/images/catalog/products/sanitario',
    'trebol': ROOT / 'trebol/assets/images/catalog/products/sanitario',
}

SKIP_LINES = {
    'CÓDIGO', 'CODIGO', 'UNID', 'FERRETERIA EL JORDAN', 'CATALOGO FOTOGRAFICO', 'MAYOREO',
}


def slugify_code(code: str) -> str:
    return re.sub(r'[^\w-]+', '-', code.lower()).strip('-')


def clean_desc(lines: list[str]) -> str:
    parts = []
    for line in lines:
        if line in SKIP_LINES or line in {'0', '1'}:
            break
        if 'Página' in line or 'Bodega' in line or re.match(r'31-AUG', line) or re.match(r'8 -', line):
            continue
        parts.append(line)
    return re.sub(r'\s+', ' ', ' '.join(parts)).strip()


def assign_brands(desc: str) -> list[str]:
    upper = desc.upper()
    has_z = 'ZAFIRO' in upper
    has_t = 'TREBOL' in upper or 'TRÉBOL' in upper
    if has_z and not has_t:
        return ['zafiro']
    if has_t and not has_z:
        return ['trebol']
    return ['zafiro', 'trebol']


def category_from_desc(desc: str) -> str:
    upper = desc.upper()
    if 'URINARIO' in upper:
        return 'Urinarios'
    if 'INODORO' in upper:
        return 'Inodoros'
    if any(token in upper for token in ('LAVAM', 'LAVABO', 'BONE')):
        return 'Lavamanos'
    return 'Línea sanitaria'


def medida_from_desc(desc: str) -> str:
    match = re.search(
        r'(\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?\s*(?:cm|mm)?)',
        desc,
        re.I,
    )
    if match:
        return re.sub(r'\s+', ' ', match.group(1).replace('×', '×')).upper()
    return 'Consultar'


def display_name(desc: str) -> str:
    text = re.sub(r'\b(ZAFIRO|TREBOL|TRÉBOL)\b', '', desc, flags=re.I)
    text = re.sub(r'\s+', ' ', text).strip(' -/')
    return text[:120] if text else desc


def parse_page(page) -> dict | None:
    lines = [line.strip() for line in page.get_text().splitlines() if line.strip()]
    code = None
    desc_lines: list[str] = []
    for index, line in enumerate(lines):
        if re.fullmatch(r'\d{4,5}L?', line):
            code = line
            desc_lines = lines[index + 1:]
            break
    if not code:
        return None
    desc = clean_desc(desc_lines)
    if not desc:
        return None
    return {
        'code': code,
        'nombre': display_name(desc),
        'description': desc,
        'medida': medida_from_desc(desc),
        'category': category_from_desc(desc),
        'brands': assign_brands(desc),
        'page': page.number,
    }


def largest_product_image(page):
    infos = [
        info for info in page.get_image_info(xrefs=True)
        if info.get('xref') and info['width'] >= 300 and info['height'] >= 300
    ]
    if not infos:
        return None
    return max(infos, key=lambda info: info['width'] * info['height'])


def load_native_image(doc, xref: int) -> Image.Image | None:
    try:
        info = doc.extract_image(xref)
        return Image.open(io.BytesIO(info['image'])).convert('RGB')
    except Exception:
        return None


def normalize_image(im: Image.Image, min_width: int = 480) -> Image.Image:
    im = im.convert('RGB')
    gray = im.convert('L')
    bbox = gray.point(lambda value: 255 if value > 245 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    pad = max(8, int(max(im.width, im.height) * 0.06))
    canvas = Image.new('RGB', (im.width + pad * 2, im.height + pad * 2), (255, 255, 255))
    canvas.paste(im, (pad, pad))
    im = canvas
    if im.width < min_width:
        scale = min_width / im.width
        im = im.resize((min_width, max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))


def save_jpeg(im: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format='JPEG', quality=92, optimize=True)


def main():
    if not PDF_PATH.exists():
        raise SystemExit(f'Missing PDF: {PDF_PATH}')

    for folder in BRAND_DIRS.values():
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(PDF_PATH)
    products = []
    for page in doc:
        parsed = parse_page(page)
        if not parsed:
            print(f'  Skipping page {page.number + 1}: no product parsed')
            continue

        image_info = largest_product_image(page)
        filename = f'{slugify_code(parsed["code"])}.jpeg'
        rel_image = f'catalog/products/sanitario/{filename}'
        parsed['image'] = rel_image

        native = None
        if image_info and image_info.get('xref'):
            native = load_native_image(doc, image_info['xref'])
        if native is None:
            clip = pymupdf.Rect(image_info['bbox']) if image_info else page.rect
            pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=clip, alpha=False)
            native = Image.open(io.BytesIO(pix.tobytes('jpeg')))

        enhanced = normalize_image(native)
        for brand in parsed['brands']:
            save_jpeg(enhanced, BRAND_DIRS[brand] / filename)

        products.append(parsed)
        print(f"  {parsed['code']}: {parsed['category']} -> {', '.join(parsed['brands'])}")

    doc.close()
    OUT_JSON.write_text(json.dumps(products, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    zafiro_count = sum(1 for p in products if 'zafiro' in p['brands'])
    trebol_count = sum(1 for p in products if 'trebol' in p['brands'])
    print(f'Wrote {OUT_JSON.name}: {len(products)} products ({zafiro_count} Zafiro, {trebol_count} Trébol)')


if __name__ == '__main__':
    main()
