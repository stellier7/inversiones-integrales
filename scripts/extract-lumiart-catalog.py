#!/usr/bin/env python3
"""Extract all Lumiart products from the catalog PDF."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'lumiart/assets/images/catalog/El Jordan Catalogo sin Logos_compressed.pdf'
OUT = ROOT / 'scripts/extracted/lumiart-products.json'

CODE_RE = re.compile(
    r'\b((?:DI|FAN|BFC\d*|BG9|BGU10|TPF|LIN|LDP|PRO|OTD)-[A-Z0-9-]+)\b'
)

PAGE_CATEGORIES = [
    (2, 4, 'lamparas-smart', 'Lámparas Smart'),
    (5, 10, 'lamparas-colgantes-led', 'Lámparas colgantes LED'),
    (11, 15, 'lamparas-colgantes', 'Lámparas colgantes'),
    (16, 16, 'lamparas-techo', 'Lámparas de techo'),
    (17, 18, 'lamparas-techo-led', 'Lámparas de techo LED'),
    (19, 19, 'lamparas-techo', 'Lámparas de techo'),
    (20, 22, 'lamparas-plafon', 'Lámparas plafón'),
    (23, 23, 'lamparas-pared', 'Lámparas de pared'),
    (24, 24, 'lamparas-mesa-pie', 'Lámparas mesa y pie'),
    (25, 26, 'ventiladores', 'Ventiadores'),
    (27, 27, 'bombillos', 'Bombillos'),
    (28, 29, 'lamparas-comerciales', 'Lámparas comerciales'),
    (30, 30, 'perfiles', 'Perfiles'),
    (31, 35, 'lamparas-exterior', 'Lámparas de exterior'),
    (36, 38, 'lamparas-farol', 'Lámparas tipo Farol'),
]

CATEGORY_ORDER = [c[2] for c in PAGE_CATEGORIES]


def category_for_page(page: int):
    for start, end, key, title in PAGE_CATEGORIES:
        if start <= page <= end:
            return key, title
    return 'otros', 'Otros'


def first_match(pattern: str, text: str) -> str:
    m = re.search(pattern, text, re.I)
    return m.group(1).strip() if m else ''


def parse_product_snippet(code: str, snippet: str, page: int) -> dict:
    watts = first_match(r'\b(\d{1,3})\s*Watts\b', snippet) or first_match(r'(\d{1,3})W', snippet)
    lumens = first_match(r'\b(\d{3,5})\s*Lumens\b', snippet) or first_match(r'(\d{3,5})LM', snippet)
    voltaje = first_match(r'(110-[^\n]+|85-[^\n]+|100-[^\n]+|120-[^\n]+|90-[^\n]+)', snippet)
    dimensiones = first_match(r'(\d+[\d\*×x\.mmA-Za-z /\+\-]+(?:mm|cm|Pulgadas))', snippet)
    color = ''
    material = ''
    uso = ''
    base = ''
    led = ''

    lines = [ln.strip() for ln in snippet.splitlines() if ln.strip()]
    for i, ln in enumerate(lines):
        low = ln.lower()
        if ln == 'Color' and i + 1 < len(lines):
            color = lines[i + 1]
        if ln == 'Material' and i + 1 < len(lines):
            material = lines[i + 1]
        if ln == 'Uso' and i + 1 < len(lines):
            uso = lines[i + 1]
        if ln == 'Base' and i + 1 < len(lines):
            base = lines[i + 1]
        if ln == 'LED' and i + 1 < len(lines) and not led:
            led = lines[i + 1]
        if 'voltaje' in low and i + 1 < len(lines) and not voltaje:
            voltaje = lines[i + 1]

    ip = first_match(r'(IP\d+)', snippet)
    smart = page <= 4 or 'Smart App' in snippet
    cat_key, cat_title = category_for_page(page)

    nombre_parts = [code]
    if color:
        nombre_parts.append(color)
    if watts:
        nombre_parts.append(f'{watts}W')

    return {
        'code': code,
        'watts': watts,
        'lumens': lumens,
        'ip': ip,
        'page': page,
        'smart': smart,
        'voltaje': voltaje,
        'led': led,
        'dimensiones': dimensiones,
        'color': color,
        'material': material,
        'uso': uso or ('Interior' if page < 31 else 'Exterior'),
        'base': base,
        'nombre': ' · '.join(nombre_parts),
        'section': cat_title,
        'section_key': cat_key,
        'category_key': cat_key,
        'category': cat_title,
        'image': '',
    }


def extract_codes_on_page(text: str) -> list[str]:
    seen = set()
    ordered = []
    for m in CODE_RE.finditer(text):
        code = m.group(1)
        if code not in seen:
            seen.add(code)
            ordered.append(code)
    return ordered


def main():
    doc = pymupdf.open(PDF)
    products = []
    for page_num in range(2, 39):
        text = doc[page_num].get_text()
        for code in extract_codes_on_page(text):
            idx = text.find(code)
            snippet = text[idx: idx + 700] if idx >= 0 else ''
            products.append(parse_product_snippet(code, snippet, page_num))

    doc.close()
    OUT.write_text(json.dumps(products, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    from collections import Counter
    counts = Counter(p['category_key'] for p in products)
    print(f'Extracted {len(products)} products')
    for key in CATEGORY_ORDER:
        if counts.get(key):
            title = next(c[3] for c in PAGE_CATEGORIES if c[2] == key)
            print(f'  {title}: {counts[key]}')


if __name__ == '__main__':
    main()
