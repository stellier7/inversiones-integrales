# Inversiones Integrales — Portal Multi-Marca

Portal estático B2B para **Inversiones Integrales** (empresa holding). Cada marca tiene su propio mini-sitio con catálogo, galería, formulario de distribuidor, carrito de cotización y sistema de vendedores NFC.

**Stack:** HTML + CSS + JavaScript vanilla (sin build step, sin npm). Desplegado en Vercel como archivos estáticos.

## Estructura del repositorio

```
/
├── index.html                 → Landing: grid de logos (selector de marca)
├── assets/
│   ├── css/landing.css        → Estilos del landing
│   └── logos/                 → Logos para el landing (el dueño los sube aquí)
│       ├── megawatt.png
│       ├── buffalo.png
│       ├── zafiro.png
│       ├── celima.png
│       └── trebol.png
├── megawatt/                  → Sitio completo MegaWatt (copia del repo original)
├── buffalo/
├── zafiro/
├── celima/
├── trebol/
└── vercel.json                → Redirects NFC /{marca}/v/{slug}
```

Cada carpeta de marca es **autocontenida**:

```
/{marca}/
├── index.html
├── productos.html
└── assets/
    ├── css/shared.css
    ├── js/
    │   ├── landing.js
    │   ├── products.js
    │   ├── gallery.js
    │   ├── contact.js
    │   ├── seller.js
    │   ├── sellers.js
    │   ├── cart.js
    │   ├── whatsapp.js
    │   └── country-codes.js
    └── images/
```

## Marcas

| Marca    | Carpeta     | Tagline                          |
|----------|-------------|----------------------------------|
| Megawatt | `/megawatt/` | Todo en luces                   |
| Buffalo  | `/buffalo/`  | Calidad para cada proyecto      |
| Zafiro   | `/zafiro/`   | Todo en cerámicas y inodoros    |
| Celima   | `/celima/`   | Soluciones para tu hogar        |
| Trébol   | `/trebol/`   | Variedad para cada proyecto     |

## Cómo agregar un logo

### Landing page (selector de marcas)

Sube la imagen en `assets/logos/{marca}.png` (por ejemplo `assets/logos/megawatt.png`). El `index.html` raíz ya apunta a esas rutas. Si el archivo no existe, se muestra un recuadro placeholder con el nombre de la marca.

### Página de cada marca

Sube el logo de la marca en `/{marca}/assets/images/logo.jpeg` (o actualiza la ruta en `index.html` y `productos.html`).

## Cómo actualizar colores de marca

Edita las variables CSS en `/{marca}/assets/css/shared.css`, sección `:root`:

```css
:root {
  --orange: #E8611F;       /* Color primario / acentos */
  --orange-deep: #C94E10;  /* Hover / variantes */
  --charcoal: #161513;     /* Fondo */
  --charcoal-soft: #242220;
  --paper: #F6F1EA;        /* Texto claro */
  --amber: #F2A93B;        /* Acento secundario */
}
```

Colores de referencia MegaWatt: `--orange: #E8611F`, `--charcoal: #161513`, `--paper: #F6F1EA`.

## Cómo agregar un vendedor (tarjetas NFC)

Edita `/{marca}/assets/js/sellers.js`:

```js
const SELLERS = {
  ramon: {
    name: 'Ramón Euceda',
    firstName: 'Ramón',
    whatsapp: '50432928908',  // sin + ni espacios
  },
  // ...
};

const BRAND_WHATSAPP = '50495002199';  // fallback sin vendedor activo
```

- `slug` = clave del objeto (ej. `ramon`)
- `firstName` = usado en saludos de WhatsApp
- `whatsapp` = número al que van cotizaciones y leads

## Sistema /v/ — URLs NFC de vendedores

Cada vendedor tiene una URL corta impresa en su tarjeta NFC:

```
https://tu-dominio.vercel.app/megawatt/v/ramon
https://tu-dominio.vercel.app/zafiro/v/maria
```

### Flujo

1. **Redirect (vercel.json):** `/megawatt/v/ramon` → `/megawatt?vendedor=ramon` (307)
2. **Detección (seller.js):** Lee `?vendedor=` o el path `/megawatt/v/{slug}`
3. **Persistencia:** Guarda el slug en `localStorage` (`megawatt-seller`, `zafiro-seller`, etc.) para que la atribución sobreviva al navegar sin el parámetro
4. **Links internos:** Todos los enlaces relevantes agregan `?vendedor={slug}`
5. **WhatsApp (whatsapp.js):** `activeWhatsAppNumber()` devuelve el WhatsApp del vendedor activo, o `BRAND_WHATSAPP` como fallback
6. **Mensajes (contact.js, cart.js):** Saludos personalizados: *"Hola Ramón, quiero ser distribuidor Zafiro."*

### Claves localStorage por marca

| Marca    | Seller key        | Cart key        |
|----------|-------------------|-----------------|
| Megawatt | `megawatt-seller` | `megawatt-cart` |
| Buffalo  | `buffalo-seller`  | `buffalo-cart`  |
| Zafiro   | `zafiro-seller`   | `zafiro-cart`   |
| Celima   | `celima-seller`   | `celima-cart`   |
| Trébol   | `trebol-seller`   | `trebol-cart`   |

## Despliegue en Vercel

1. Conecta este repositorio a Vercel
2. Framework preset: **Other** (sitio estático, sin build command)
3. Output directory: `/` (raíz)
4. `vercel.json` ya incluye los redirects NFC

## Desarrollo local

Sirve la raíz con cualquier servidor estático:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080/` para el selector de marcas, o `http://localhost:8080/megawatt/` para una marca.

## Scripts de utilidad

`scripts/setup-brands.py` — regenera las carpetas de marca (buffalo, zafiro, celima, trébol) a partir de `/megawatt/`. Útil si actualizas la plantilla Megawatt y quieres propagar cambios estructurales.

## Origen

La carpeta `/megawatt/` es una copia del proyecto [MegaWatt](https://github.com/stellier7/MegaWatt) (vanilla HTML/CSS/JS). El repo original no se modifica.
