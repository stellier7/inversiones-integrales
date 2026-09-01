# Product photos / media

## Naming

```
foco-{watts}W.jpeg
spot-redondo-{watts}W.jpeg
spot-redondo-color-{watts}W.jpeg
spot-cuadrado-{watts}W.jpeg
spot-cuadrado-color-{watts}W.jpeg
street-{watts}W.jpeg          ← 9:16 on the site
emergencia.mov or .mp4
logo.jpeg
```

## Official catalog crops (`assets/images/catalog/`)

Studio shots cropped from the MegaWatt PDF. The catalog finder uses these instead of packaging photos: one image per series, then the wattage unlocks the exact SKU and spec sheet.

```
bombillo-smd.jpeg
bombillo-led-alta-potencia.jpeg
bombillo-industrial.jpeg
panel-slim-redondo.jpeg
panel-slim-cuadrado.jpeg
panel-bicolor-redondo.jpeg
panel-bicolor-cuadrado.jpeg
emergencia.jpeg
street-light.jpeg
```

## Gallery (`assets/images/gallery/`)

Celima lifestyle photos (pool deck, kitchen and bath tile installations):

```
IMG_0484.jpeg
IMG_0486.jpeg
IMG_0487.jpeg
IMG_0488.jpeg
IMG_0489.jpeg
```

Referenced in `assets/js/gallery.js` for the homepage carousel and lightbox.

Street lights and interior focos **7W–18W** use **9:16**.
Focos **20W–100W** use **5:7**.
Studio catalog crops use **contain** inside the card.
Other products use **1:1** (square).

## Note on video

`.mov` works best in Safari. For Chrome/Android, prefer `emergencia.mp4`.
