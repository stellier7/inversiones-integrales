# Buffalo product media

- `logo.jpeg` — site logo
- `catalog/products/pvc/` — páginas del catálogo PVC (IMG_0477–0483)
- `catalog/products/forjas/` — páginas de forjas y herrajes (IMG_0501–0507)
- `catalog/products/tornillos/` — fotos de tornillos para techo
- `catalog/products/accesorios/` — esponjas multi-uso
- `gallery/` — fotos de productos en tienda (tornillos, esponjas)

Regenerar catálogo después de editar páginas o datos:

```bash
python3 scripts/extract-buffalo-catalog.py
python3 scripts/crop-buffalo-catalog.py
python3 scripts/generate-brand-products.py
```

Las páginas PVC se recortan en fotos de estudio centradas (800×800, fondo blanco) por línea de producto; las forjas se recortan fila por fila; tornillos y esponjas se normalizan al mismo formato en `catalog/products/crops/`.

**Estilo de recorte:** producto centrado, fondo `#ffffff`, sin líneas de tabla del catálogo impreso.
