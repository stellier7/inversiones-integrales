# Zafiro product media

- `logo.jpeg` — site logo
- `catalog/products/piso/` — pisos organizados por acabado (`brillante`, `mate`, `decorativo`)
- `catalog/products/muro/` — muros organizados por acabado
- `gallery/` — fotos para la galería del inicio

Regenerar catálogo:

```bash
python3 scripts/build-zafiro-catalog.py
python3 scripts/generate-brand-products.py
```

Fuentes de datos en `scripts/extracted/zafiro-products-vision.json` (86 fotos, 12 duplicados omitidos).
