#!/usr/bin/env python3
"""Organize Zafiro ceramic photos and build zafiro-products.json."""
from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VISION = ROOT / 'scripts/extracted/zafiro-products-vision.json'
OUT_JSON = ROOT / 'scripts/extracted/zafiro-products.json'
PRODUCTS_DIR = ROOT / 'zafiro/assets/images/catalog/products'


def slugify(text: str, max_len: int = 48) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[\s_]+', '-', text).strip('-')
    return text[:max_len] or 'producto'


def unique_slug(base: str, used: set[str]) -> str:
    slug = base
    n = 2
    while slug in used:
        slug = f'{base}-{n}'
        n += 1
    used.add(slug)
    return slug


def main():
    items = json.loads(VISION.read_text(encoding='utf-8'))
    active = [p for p in items if not p.get('duplicate_of')]
    removed = len(items) - len(active)
    print(f'Keeping {len(active)} products ({removed} duplicates skipped)')

    used_slugs: set[str] = set()
    products = []

    for p in active:
        aplic = p['aplicacion']
        acabado = p.get('acabado') or 'Brillante'
        nombre = p.get('nombre') or p.get('code') or p['file'][:8]
        code = p.get('code') or slugify(nombre, 20).upper()[:12]
        medida = p.get('medida') or ''
        color = p.get('color') or ''

        folder = PRODUCTS_DIR / aplic / acabado.lower()
        folder.mkdir(parents=True, exist_ok=True)

        base = slugify(nombre if not re.fullmatch(r'[\dA-Z]{4,}', nombre) else f'{nombre}-{code.lower()}')
        slug = unique_slug(base, used_slugs)
        dest_name = f'{slug}.jpeg'
        src = PRODUCTS_DIR / p['file']
        dest = folder / dest_name
        if src.exists():
            shutil.move(src, dest)
        rel = f'catalog/products/{aplic}/{acabado.lower()}/{dest_name}'

        section_title = 'Piso' if aplic == 'piso' else 'Muro'
        section_key = f'{aplic}-{acabado.lower()}'

        display = nombre
        if color and color.lower() not in nombre.lower():
            display = f'{nombre} {color.title()}'

        products.append({
            'code': code,
            'nombre': display,
            'name': nombre,
            'color': color,
            'medida': medida or 'Consultar',
            'rendimiento': '',
            'caja': '',
            'acabado': acabado,
            'linea': 'Zafiro',
            'aplicacion': section_title,
            'section': f'{section_title} · {acabado}',
            'section_key': section_key,
            'finish_group': acabado,
            'image': rel,
        })

    OUT_JSON.write_text(json.dumps(products, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {OUT_JSON.relative_to(ROOT)}')

    from collections import Counter
    print('Sections:', dict(Counter(x['section'] for x in products)))


if __name__ == '__main__':
    main()
