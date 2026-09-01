# Buffalo product media

- `logo.jpeg` — site logo
- `catalog/products/pvc/` — páginas del catálogo PVC (IMG_0477–0483)
- `catalog/products/forjas/` — páginas de forjas y herrajes (IMG_0501–0507)
- `catalog/products/tornillos/` — fotos de tornillos para techo
- `catalog/products/accesorios/` — esponjas multi-uso
- `gallery/` — fotos y videos para la galería del inicio

Regenerar `assets/js/products.js` después de editar el catálogo:

```bash
python3 scripts/extract-buffalo-catalog.py
python3 scripts/generate-brand-products.py
```
