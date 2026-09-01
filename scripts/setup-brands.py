#!/usr/bin/env python3
"""Generate brand folders from megawatt template."""
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEGAWATT = os.path.join(ROOT, 'megawatt')

BRANDS = {
    'buffalo': {
        'display': 'BUFFALO',
        'display_title': 'BUFFALO',
        'name': 'Buffalo',
        'tagline': 'Calidad para cada proyecto',
        'hero_tag': 'Calidad para cada proyecto — catálogo, contacto y cotización en un solo lugar.',
        'colors': {
            '--orange': '#B8860B',
            '--orange-deep': '#8B6914',
            '--charcoal': '#1A1814',
            '--charcoal-soft': '#2A2620',
            '--amber': '#D4A84B',
        },
        'emoji': '🦬',
    },
    'zafiro': {
        'display': 'ZAFIRO',
        'display_title': 'ZAFIRO',
        'name': 'Zafiro',
        'tagline': 'Todo en cerámicas y inodoros',
        'hero_tag': 'Todo en cerámicas y inodoros — catálogo, contacto y cotización en un solo lugar.',
        'colors': {
            '--orange': '#2E6B9E',
            '--orange-deep': '#1E4F78',
            '--charcoal': '#141820',
            '--charcoal-soft': '#1E2430',
            '--amber': '#5BA4D9',
        },
        'emoji': '💎',
    },
    'celima': {
        'display': 'CELIMA',
        'display_title': 'CELIMA',
        'name': 'Celima',
        'tagline': 'Soluciones para tu hogar',
        'hero_tag': 'Soluciones para tu hogar y negocio — catálogo, contacto y cotización en un solo lugar.',
        'colors': {
            '--orange': '#3D8B6E',
            '--orange-deep': '#2A6B52',
            '--charcoal': '#141816',
            '--charcoal-soft': '#1E2420',
            '--amber': '#5CB88A',
        },
        'emoji': '🏠',
    },
    'trebol': {
        'display': 'TRÉBOL',
        'display_title': 'TRÉBOL',
        'name': 'Trébol',
        'tagline': 'Variedad para cada proyecto',
        'hero_tag': 'Variedad para cada proyecto — catálogo, contacto y cotización en un solo lugar.',
        'colors': {
            '--orange': '#2E8B57',
            '--orange-deep': '#1F6B40',
            '--charcoal': '#141816',
            '--charcoal-soft': '#1E2420',
            '--amber': '#4CAF70',
        },
        'emoji': '☘️',
    },
}

PLACEHOLDER_PRODUCTS_JS = '''// Placeholder catalog — owner will replace with real product data.
const img = (file) => (file ? `assets/images/${file}` : '');

const LINEA = {
  general: 'Línea general',
};

const catalogSections = [
  {
    id: 'general',
    linea: LINEA.general,
    eyebrow: 'Catálogo en preparación',
    title: 'Productos {name}',
    intro: 'Estamos preparando el catálogo completo de {name}. Mientras tanto, contáctanos por WhatsApp para cotizar.',
    image: '',
    groups: [
      {
        id: 'placeholder',
        kicker: 'Próximamente',
        menuLabel: 'Línea general',
        finderLabel: 'Productos generales',
        title: 'Catálogo en preparación',
        blurb: 'El catálogo de {name} estará disponible pronto. Escríbenos por WhatsApp para más información.',
      },
    ],
  },
];

const products = [];

function studioForSpot() { return ''; }

function initCatalog() {
  const tree = document.getElementById('catalogTree');
  if (!tree) return;

  tree.innerHTML = `
    <div class="catalog-placeholder">
      <h3>Catálogo en preparación</h3>
      <p>Estamos armando el catálogo de {name}. Contáctanos por WhatsApp para cotizar productos.</p>
    </div>
  `;
}

function initFeatured() {
  const track = document.getElementById('featuredTrack');
  if (!track) return;
  track.innerHTML = `
    <div class="featured-card featured-card--placeholder">
      <div class="featured-card-body">
        <div class="featured-eyebrow">{name}</div>
        <h3>Productos próximamente</h3>
        <p>El catálogo de {name} estará disponible pronto.</p>
      </div>
    </div>
  `;
}

function refreshProductCardButtons() {}
function isVideoPath() { return false; }
'''

PLACEHOLDER_GALLERY_JS = '''const GALLERY_ITEMS = [];

function initGallery() {
  const track = document.getElementById('galleryTrack');
  const openBtn = document.getElementById('galleryOpenBtn');
  if (track) {
    track.innerHTML = '<p class="gallery-empty">Galería en preparación.</p>';
  }
  if (openBtn) openBtn.style.display = 'none';
}
'''


def replace_brand_name(text, brand_id, config):
    name = config['name']
    display = config['display']
    replacements = [
        ('MegaWatt', name),
        ('MEGAWATT', display),
        ('MEGA WATT', display.replace('É', 'E') if 'É' in display else display),
        ('megawatt', brand_id),
        ('MEGA<span class="bolt-char">⚡</span>WATT', f'{display}<span class="bolt-char">{config["emoji"]}</span>'),
        ('Iluminación LED para todo tu proyecto', config['tagline']),
        ('Todo en luces — del foco doméstico a la luz de calle', config['hero_tag']),
        ('iluminación MegaWatt', f'productos {name}'),
        ('línea MegaWatt', f'línea {name}'),
        ('línea de iluminación MegaWatt', f'línea {name}'),
        ('Selección MegaWatt', f'Selección {name}'),
        ('distribuidor MegaWatt', f'distribuidor {name}'),
        ('productos MegaWatt', f'productos {name}'),
        ('Bombillos, empotrables, emergencia y alumbrado público', 'Productos para tu hogar y negocio'),
        ('Bombillos LED, iluminación de techo (spots) y líneas especiales', 'Catálogo de productos'),
        ('bombillos, empotrables o luminarias', 'productos'),
        ('Iluminación', name),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text


def patch_css(css, colors):
    for var, val in colors.items():
        css = re.sub(rf'({re.escape(var)}:\s*)[^;]+;', rf'\1{val};', css)
    return css


def patch_seller_js(js, brand_id):
    js = re.sub(
        r"match\(/\^\\\/megawatt\\\/v\\\/",
        f"match(/^\\/{brand_id}\\/v\\/",
        js,
    )
    js = js.replace("const SELLER_STORAGE_KEY = 'megawatt-seller';", f"const SELLER_STORAGE_KEY = '{brand_id}-seller';")
    return js


def patch_cart_js(js, brand_id, name):
    js = js.replace("const CART_STORAGE_KEY = 'megawatt-cart';", f"const CART_STORAGE_KEY = '{brand_id}-cart';")
    js = js.replace("new CustomEvent('megawatt:cart')", f"new CustomEvent('{brand_id}:cart')")
    js = js.replace("document.addEventListener('megawatt:cart'", f"document.addEventListener('{brand_id}:cart'")
    js = js.replace("return 'MegaWatt';", f"return '{name}';")
    js = js.replace("por WhatsApp a MegaWatt.", f"por WhatsApp a {name}.")
    js = js.replace('productos MegaWatt', f'productos {name}')
    return js


def patch_sellers_js(js, brand_id, name):
    js = js.replace('/** MegaWatt — contacto central', f'/** {name} — contacto central')
    js = re.sub(
        r'const SELLERS = \{[\s\S]*?\};',
        f'''const SELLERS = {{
  ejemplo: {{
    name: 'Vendedor Ejemplo',
    firstName: 'Ejemplo',
    whatsapp: '50400000000',
  }},
}};''',
        js,
    )
    return js


def create_brand(brand_id, config):
    dest = os.path.join(ROOT, brand_id)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(MEGAWATT, dest)

  # Remove megawatt-specific images? Keep structure, owner adds logos
    for fname in ('index.html', 'productos.html'):
        path = os.path.join(dest, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = replace_brand_name(content, brand_id, config)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

    css_path = os.path.join(dest, 'assets/css/shared.css')
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    css = patch_css(css, config['colors'])
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)

    for js_name, patcher in [
        ('seller.js', lambda j: patch_seller_js(j, brand_id)),
        ('cart.js', lambda j: patch_cart_js(j, brand_id, config['name'])),
        ('sellers.js', lambda j: patch_sellers_js(j, brand_id, config['name'])),
        ('contact.js', lambda j: replace_brand_name(j, brand_id, config)),
    ]:
        path = os.path.join(dest, 'assets/js', js_name)
        with open(path, 'r', encoding='utf-8') as f:
            js = f.read()
        js = patcher(js)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(js)

    products_path = os.path.join(dest, 'assets/js/products.js')
    with open(products_path, 'w', encoding='utf-8') as f:
        f.write(PLACEHOLDER_PRODUCTS_JS.replace('{name}', config['name']))

    gallery_path = os.path.join(dest, 'assets/js/gallery.js')
    with open(gallery_path, 'w', encoding='utf-8') as f:
        f.write(PLACEHOLDER_GALLERY_JS)

    readme_path = os.path.join(dest, 'README.md')
    if os.path.exists(readme_path):
        os.remove(readme_path)

    print(f'Created {brand_id}/')


def main():
    for brand_id, config in BRANDS.items():
        create_brand(brand_id, config)


if __name__ == '__main__':
    main()
