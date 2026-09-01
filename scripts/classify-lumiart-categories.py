#!/usr/bin/env python3
"""Assign Lumiart catalog categories from PDF product specs."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'scripts/extracted/lumiart-products.json'
PDF = ROOT / 'lumiart/assets/images/catalog/El Jordan Catalogo sin Logos_compressed.pdf'

CATEGORIES = [
    ('lamparas-smart', 'Lámparas Smart', 'Control por app y voz — lámparas inteligentes CCT.'),
    ('lamparas-colgantes-led', 'Lámparas colgantes LED', 'Colgantes con LED integrado.'),
    ('lamparas-colgantes', 'Lámparas colgantes', 'Colgantes para foco — base E27, G9 o E12.'),
]


def classify_product(page_text: str, code: str, smart: bool):
    if smart:
        return CATEGORIES[0]
    idx = page_text.find(code)
    snippet = page_text[idx: idx + 450] if idx >= 0 else ''
    if re.search(r'\bBase\b|E27|G9|E12', snippet):
        return CATEGORIES[2]
    return CATEGORIES[1]


def main():
    items = json.loads(JSON_PATH.read_text(encoding='utf-8'))
    doc = pymupdf.open(PDF)
    page_text = {i: doc[i].get_text() for i in range(len(doc))}
    doc.close()

    counts = {k: 0 for k, _, _ in CATEGORIES}
    for product in items:
        key, title, _ = classify_product(
            page_text.get(product['page'], ''),
            product['code'],
            bool(product.get('smart')),
        )
        product['category_key'] = key
        product['category'] = title
        product['section'] = title
        product['section_key'] = key
        counts[key] += 1

    JSON_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for key, title, _ in CATEGORIES:
        print(f'{title}: {counts[key]}')


if __name__ == '__main__':
    main()
