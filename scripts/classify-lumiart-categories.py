#!/usr/bin/env python3
"""Assign Lumiart categories from PDF page ranges."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT = ROOT / 'scripts/extract-lumiart-catalog.py'
JSON_PATH = ROOT / 'scripts/extracted/lumiart-products.json'


def main():
    subprocess.check_call([sys.executable, str(EXTRACT)])
    items = json.loads(JSON_PATH.read_text(encoding='utf-8'))
    from collections import Counter
    counts = Counter(p['category'] for p in items)
    for cat, n in counts.most_common():
        print(f'{cat}: {n}')


if __name__ == '__main__':
    main()
