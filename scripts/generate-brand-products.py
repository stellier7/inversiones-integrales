#!/usr/bin/env python3
"""Generate products.js from extracted catalog JSON."""
import json
import re
from pathlib import Path
from collections import OrderedDict, defaultdict

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / 'scripts' / 'extracted'

GRID_RUNTIME = r'''
const img = (file) => (file ? `assets/images/${file}` : '');

const catalogState = { category: '', group: '' };

function isVideoPath(path) {
  return /\.(mp4|webm|mov)$/i.test(path || '');
}

function cartQtyForProduct(id) {
  if (typeof getCartQty !== 'function') return 0;
  return getCartQty(id);
}

function addToCartButtonHtml(p) {
  const qty = cartQtyForProduct(p.id);
  const inCart = qty > 0;
  return `<button type="button" class="add-to-cart-btn${inCart ? ' is-in-cart' : ''}" data-product-id="${p.id}" aria-label="${inCart ? `Agregar otra unidad de ${p.nombre}` : `Agregar ${p.nombre} al carrito`}">${inCart ? `En el carrito · ${qty}` : 'Agregar'}</button>`;
}

function productPhotoHtml(product) {
  if (!product.image) return '<span>Foto pendiente</span>';
  if (isVideoPath(product.image)) {
    return `<video src="${product.image}" muted playsinline preload="metadata" aria-label="${product.nombre}"></video>`;
  }
  return `<img src="${product.image}" alt="${product.nombre}" loading="lazy">`;
}

function specChipsHtml(p) {
  const chips = [];
  if (p.chip1) chips.push(p.chip1);
  if (p.chip2) chips.push(p.chip2);
  if (p.chip3) chips.push(p.chip3);
  if (p.linea) chips.push(p.linea);
  return chips.map((c) => `<span>${c}</span>`).join('');
}

function groupProducts(groupId) {
  return products.filter((p) => p.group === groupId);
}

function categoryMeta(id) {
  return catalogSections.find((s) => s.id === id) || null;
}

function productCardHtml(p) {
  return `
    <article class="product-card grid-product-card" data-product-id="${p.id}">
      <div class="p-photo is-studio">${productPhotoHtml(p)}</div>
      <div class="p-body">
        <div class="p-cat">${p.subcategoria || ''}</div>
        <h4>${p.nombre}</h4>
        <div class="p-specs">${specChipsHtml(p)}</div>
        ${addToCartButtonHtml(p)}
      </div>
    </article>`;
}

function productGridHtml(groupId) {
  const items = groupProducts(groupId);
  return `<div class="product-grid">${items.map(productCardHtml).join('')}</div>`;
}

function groupTabHtml(group, sectionId) {
  const selected = catalogState.group === group.id && catalogState.category === sectionId;
  return `<button type="button" class="series-card grid-group-tab${selected ? ' is-selected' : ''}" data-group="${group.id}" data-category="${sectionId}"><span class="series-card-copy"><span class="p-cat">${group.kicker}</span><span class="series-card-title">${group.menuLabel}</span></span></button>`;
}

function categoryCardHtml(section) {
  const open = catalogState.category === section.id;
  const activeGroup = section.groups.find((g) => g.id === catalogState.group);
  return `
    <article class="cat-card${open ? ' is-open' : ''}" data-category="${section.id}">
      <button type="button" class="cat-card-toggle" data-category="${section.id}" aria-expanded="${open}">
        <span class="cat-card-thumb"><img src="${section.image}" alt=""></span>
        <span class="cat-card-copy">
          <span class="eyebrow">${section.eyebrow}</span>
          <span class="cat-card-title">${section.title}</span>
          <span class="cat-card-intro">${section.intro}</span>
        </span>
        <span class="cat-card-chevron" aria-hidden="true">${open ? '−' : '+'}</span>
      </button>
      ${open ? `<div class="cat-card-body">
        <div class="series-grid series-grid--${Math.min(section.groups.length, 4)}">${section.groups.map((g) => groupTabHtml(g, section.id)).join('')}</div>
        ${activeGroup ? productGridHtml(activeGroup.id) : '<p class="finder-hint">Elige un acabado o línea para ver los diseños.</p>'}
      </div>` : ''}
    </article>`;
}

function renderCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;
  root.innerHTML = catalogSections.map(categoryCardHtml).join('');
  if (typeof refreshProductCardButtons === 'function') refreshProductCardButtons();
}

function toggleCategory(categoryId) {
  if (catalogState.category === categoryId) {
    catalogState.category = '';
    catalogState.group = '';
  } else {
    catalogState.category = categoryId;
    const section = categoryMeta(categoryId);
    catalogState.group = section?.groups[0]?.id || '';
  }
  renderCatalog();
}

function toggleGroup(groupId, categoryId) {
  catalogState.category = categoryId;
  catalogState.group = catalogState.group === groupId ? '' : groupId;
  renderCatalog();
}

function refreshProductCardButtons() {
  document.querySelectorAll('.add-to-cart-btn[data-product-id]').forEach((btn) => {
    const product = products.find((p) => p.id === btn.dataset.productId);
    if (!product) return;
    const qty = cartQtyForProduct(product.id);
    const inCart = qty > 0;
    btn.classList.toggle('is-in-cart', inCart);
    btn.textContent = inCart ? `En el carrito · ${qty}` : 'Agregar';
  });
}

function initCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;
  root.addEventListener('click', (e) => {
    const group = e.target.closest('.grid-group-tab');
    if (group) {
      toggleGroup(group.dataset.group, group.dataset.category);
      return;
    }
    const category = e.target.closest('.cat-card-toggle');
    if (category) toggleCategory(category.dataset.category);
  });
  renderCatalog();
}

function featuredCardHtml(p) {
  return `<div class="product-card featured-card" data-product-id="${p.id}"><div class="p-photo featured-photo is-studio">${productPhotoHtml(p)}</div><div class="p-body"><div class="p-cat">${p.subcategoria || ''}</div><h4>${p.nombre}</h4><div class="p-specs">${specChipsHtml(p)}</div>${addToCartButtonHtml(p)}</div></div>`;
}

function initFeatured() {
  const track = document.getElementById('featuredTrack');
  if (!track || !products.length) return;
  const featured = products.slice(0, Math.min(8, products.length));
  const cards = featured.map(featuredCardHtml).join('');
  track.innerHTML = cards + cards;
}
'''

BUFFALO_RUNTIME = r'''
const img = (file) => (file ? `assets/images/${file}` : '');

function medidaSortValue(value) {
  const nums = String(value).match(/\d+/g);
  if (!nums) return 0;
  return Number(nums[0]) + (nums[1] ? Number(nums[1]) / 100 : 0);
}

const catalogState = { category: '', series: '', medida: '' };

function isVideoPath(path) {
  return /\.(mp4|webm|mov)$/i.test(path || '');
}

function productPhotoHtml(product) {
  if (!product.image) return '<span>Foto pendiente</span>';
  if (isVideoPath(product.image)) {
    return `<video src="${product.image}" muted playsinline preload="metadata" aria-label="${product.nombre}"></video>`;
  }
  return `<img src="${product.image}" alt="${product.nombre}" loading="lazy">`;
}

function cartQtyForProduct(id) {
  if (typeof getCartQty !== 'function') return 0;
  return getCartQty(id);
}

function addToCartButtonHtml(p) {
  const qty = cartQtyForProduct(p.id);
  const inCart = qty > 0;
  return `<button type="button" class="add-to-cart-btn${inCart ? ' is-in-cart' : ''}" data-product-id="${p.id}" aria-label="${inCart ? `Agregar otra unidad de ${p.nombre}` : `Agregar ${p.nombre} al carrito`}">${inCart ? `En el carrito · ${qty}` : 'Agregar'}</button>`;
}

function categoryMeta(categoryId) {
  return catalogSections.find((section) => section.id === categoryId) || null;
}

function groupMeta(groupId) {
  for (const section of catalogSections) {
    const group = section.groups.find((entry) => entry.id === groupId);
    if (group) return { ...group, categoryId: section.id };
  }
  return null;
}

function seriesImage(groupId) {
  return img(GROUP_STUDIO[groupId] || '');
}

function seriesProducts(groupId) {
  return products
    .filter((p) => p.group === groupId)
    .sort((a, b) => medidaSortValue(a.medida) - medidaSortValue(b.medida));
}

function selectedProduct() {
  if (!catalogState.series || !catalogState.medida) return null;
  return seriesProducts(catalogState.series).find((p) => p.medida === catalogState.medida) || null;
}

function specRows(product) {
  const rows = [
    ['Referencia', product.modelo],
    ['Medida', product.medida],
    ['Línea', product.linea],
  ];
  return rows.filter(([, value]) => value);
}

function medidaPillsHtml(items) {
  const label = items.length === 1 ? 'Presentación' : 'Medida';
  return `
    <div class="watt-pills" role="listbox" aria-label="${label}">
      ${items.map((product) => `
        <button type="button" class="watt-pill${catalogState.medida === product.medida ? ' is-selected' : ''}" data-medida="${product.medida}" aria-pressed="${catalogState.medida === product.medida}">${product.medida}</button>`).join('')}
    </div>
  `;
}

function seriesDetailHtml(group) {
  const items = seriesProducts(group.id);
  let product = selectedProduct();
  if (!product && items.length === 1) {
    product = items[0];
    catalogState.medida = product.medida;
  }
  const photo = product
    ? productPhotoHtml(product)
    : seriesImage(group.id)
      ? `<img src="${seriesImage(group.id)}" alt="${group.title}">`
      : '';
  const rows = product
    ? specRows(product).map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join('')
    : '';
  const pillBlock = items.length > 1
    ? `<div class="watt-block"><div class="watt-label">Medida</div>${medidaPillsHtml(items)}</div>`
    : '';
  const footer = product
    ? `<table class="finder-specs"><tbody>${rows}</tbody></table>${addToCartButtonHtml(product)}`
    : '<p class="finder-hint">Elige la medida para ver la referencia exacta.</p>';

  return `
    <div class="series-detail">
      <div class="finder-photo">${photo}</div>
      <div class="finder-copy">
        <div class="p-cat">${group.kicker}</div>
        <h3>${group.title}</h3>
        <p>${group.blurb}</p>
        ${pillBlock}
        ${footer}
      </div>
    </div>`;
}

function seriesCardHtml(group) {
  const selected = catalogState.series === group.id;
  return `<button type="button" class="series-card${selected ? ' is-selected' : ''}" data-series="${group.id}"><span class="series-card-thumb"><img src="${seriesImage(group.id)}" alt=""></span><span class="series-card-copy"><span class="p-cat">${group.kicker}</span><span class="series-card-title">${group.menuLabel}</span></span></button>`;
}

function categoryCardHtml(section) {
  const open = catalogState.category === section.id;
  return `
    <article class="cat-card${open ? ' is-open' : ''}" data-category="${section.id}">
      <button type="button" class="cat-card-toggle" data-category="${section.id}" aria-expanded="${open}">
        <span class="cat-card-thumb"><img src="${section.image}" alt=""></span>
        <span class="cat-card-copy">
          <span class="eyebrow">${section.eyebrow}</span>
          <span class="cat-card-title">${section.title}</span>
          <span class="cat-card-intro">${section.intro}</span>
        </span>
        <span class="cat-card-chevron" aria-hidden="true">${open ? '−' : '+'}</span>
      </button>
      ${open ? `<div class="cat-card-body">
        <div class="series-grid series-grid--${Math.min(section.groups.length, 4)}">${section.groups.map(seriesCardHtml).join('')}</div>
        ${catalogState.series && groupMeta(catalogState.series)?.categoryId === section.id ? seriesDetailHtml(groupMeta(catalogState.series)) : ''}
      </div>` : ''}
    </article>`;
}

function renderCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;
  root.innerHTML = catalogSections.map(categoryCardHtml).join('');
  refreshProductCardButtons();
}

function toggleCategory(categoryId) {
  if (catalogState.category === categoryId) {
    catalogState.category = '';
    catalogState.series = '';
    catalogState.medida = '';
  } else {
    catalogState.category = categoryId;
    catalogState.series = '';
    catalogState.medida = '';
  }
  renderCatalog();
}

function toggleSeries(seriesId) {
  if (catalogState.series === seriesId) {
    catalogState.series = '';
    catalogState.medida = '';
  } else {
    catalogState.series = seriesId;
    catalogState.medida = '';
    const items = seriesProducts(seriesId);
    if (items.length === 1) catalogState.medida = items[0].medida;
  }
  renderCatalog();
}

function setMedida(medida) {
  catalogState.medida = medida;
  renderCatalog();
}

function initCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;
  root.addEventListener('click', (e) => {
    const pill = e.target.closest('.watt-pill');
    if (pill) { setMedida(pill.dataset.medida); return; }
    const series = e.target.closest('.series-card');
    if (series) { toggleSeries(series.dataset.series); return; }
    const category = e.target.closest('.cat-card-toggle');
    if (category) toggleCategory(category.dataset.category);
  });
  renderCatalog();
}

function featuredCardHtml(p) {
  return `<div class="product-card featured-card" data-product-id="${p.id}"><div class="p-photo featured-photo is-studio">${productPhotoHtml(p)}</div><div class="p-body"><div class="p-cat">${p.subcategoria || ''}</div><h4>${p.nombre}</h4><div class="p-specs"><span>${p.medida}</span></div>${addToCartButtonHtml(p)}</div></div>`;
}

function refreshProductCardButtons() {
  document.querySelectorAll('.add-to-cart-btn[data-product-id]').forEach((btn) => {
    const product = products.find((p) => p.id === btn.dataset.productId);
    if (!product) return;
    const qty = cartQtyForProduct(product.id);
    const inCart = qty > 0;
    btn.classList.toggle('is-in-cart', inCart);
    btn.textContent = inCart ? `En el carrito · ${qty}` : 'Agregar';
  });
}

function initFeatured() {
  const track = document.getElementById('featuredTrack');
  if (!track || !products.length) return;
  const picks = [];
  const seen = new Set();
  for (const p of products) {
    if (seen.has(p.group)) continue;
    seen.add(p.group);
    picks.push(p);
    if (picks.length >= 8) break;
  }
  const cards = picks.map(featuredCardHtml).join('');
  track.innerHTML = cards + cards;
}

function studioForSpot() { return ''; }
'''


def js_str(s):
    return json.dumps(s or '', ensure_ascii=False)


def slugify(s):
    s = re.sub(r'[^\w\s-]', '', s.lower().strip())
    return re.sub(r'[\s_]+', '-', s)[:60].strip('-')


def generate_celima():
    items = json.loads((EXTRACTED / 'celima-products.json').read_text())
    for p in items:
        if p['name'].startswith('Muro '):
            p['name'] = p['name'][5:]
        if p['name'].startswith('Piso '):
            p['name'] = p['name'][5:]
        p['nombre'] = f"{p['name']} {p['color']}".strip()

    sections = OrderedDict()
    for p in items:
        sec = p['section']
        if sec not in sections:
            sections[sec] = OrderedDict()
        fin = p['finish_group'] or 'General'
        sections[sec].setdefault(fin, []).append(p)

    catalog_sections = []
    products_js = []
    for sec_title, finishes in sections.items():
        sec_id = slugify(sec_title)
        groups = []
        cover_image = ''
        for fin, prods in finishes.items():
            gid = slugify(f'{sec_id}-{fin}')
            if prods and prods[0].get('image') and not cover_image:
                cover_image = prods[0]['image']
            groups.append({
                'id': gid,
                'kicker': fin,
                'menuLabel': fin,
                'finderLabel': fin,
                'title': fin,
                'blurb': f'{len(prods)} diseños en acabado {fin.lower()}.',
            })
            for p in prods:
                pid = f"celima-{p['code']}"
                products_js.append({
                    'id': pid,
                    'nombre': p['nombre'],
                    'group': gid,
                    'subcategoria': f"{p['acabado']} · Ref. {p['code']}",
                    'linea': p['linea'],
                    'chip1': p['medida'],
                    'chip2': p['rendimiento'],
                    'chip3': p['caja'],
                    'image': p.get('image', ''),
                    'modelo': p['code'],
                    'linea_cat': p['linea'],
                })
        aplic = 'Pared' if 'Muro' in sec_title else 'Piso'
        catalog_sections.append({
            'id': sec_id,
            'linea': aplic,
            'eyebrow': p['linea'] if prods else 'Celima',
            'title': sec_title.replace('Muro · ', 'Pared ').replace('Piso · ', 'Piso '),
            'intro': f'Cerámica Celima — {sec_title}. Elige el acabado y agrega a tu cotización.',
            'image': f"img('{cover_image}')" if cover_image else "''",
            'groups': groups,
        })

    return build_file('Celima', 'celima', catalog_sections, products_js)


def generate_lumiart():
    items = json.loads((EXTRACTED / 'lumiart-products.json').read_text())
    category_defs = [
        ('lamparas-smart', 'Lámparas Smart', 'Control por app y voz — lámparas inteligentes CCT.'),
        ('lamparas-colgantes-led', 'Lámparas colgantes LED', 'Colgantes con LED integrado.'),
        ('lamparas-colgantes', 'Lámparas colgantes', 'Colgantes para foco — base E27, G9 o E12.'),
        ('lamparas-techo-led', 'Lámparas de techo LED', 'Plafones y lámparas de techo con LED integrado.'),
        ('lamparas-techo', 'Lámparas de techo', 'Lámparas de techo para foco.'),
        ('lamparas-plafon', 'Lámparas plafón', 'Plafones LED de superficie.'),
        ('lamparas-pared', 'Lámparas de pared', 'Apliques y lámparas de pared.'),
        ('lamparas-mesa-pie', 'Lámparas mesa y pie', 'Lámparas de mesa y de pie.'),
        ('ventiladores', 'Ventiadores', 'Ventiladores de techo con luz LED.'),
        ('bombillos', 'Bombillos', 'Bombillos LED — E12, G9, GU10 y más.'),
        ('lamparas-comerciales', 'Lámparas comerciales', 'Tubos, paneles y lineales para comercio e industria.'),
        ('perfiles', 'Perfiles', 'Perfiles de aluminio para tira LED — 2 metros.'),
        ('lamparas-exterior', 'Lámparas de exterior', 'Iluminación exterior IP65.'),
        ('lamparas-farol', 'Lámparas tipo Farol', 'Faroles colgantes y de pared para exterior.'),
    ]

    catalog_sections = []
    products_js = []

    for cat_id, cat_title, cat_intro in category_defs:
        prods = [p for p in items if p.get('category_key', p.get('section_key')) == cat_id]
        if not prods:
            continue
        gid = cat_id
        cover = prods[0].get('image', '')
        catalog_sections.append({
            'id': cat_id,
            'linea': 'Iluminación',
            'eyebrow': 'Lumiart',
            'title': cat_title,
            'intro': cat_intro,
            'image': f"img('{cover}')" if cover else "''",
            'groups': [{
                'id': gid,
                'kicker': cat_title,
                'menuLabel': 'Ver modelos',
                'finderLabel': cat_title,
                'title': cat_title,
                'blurb': f'{len(prods)} referencias en esta línea.',
            }],
        })
        for p in prods:
            pid = slugify(f"lumiart-{p['code']}")
            products_js.append({
                'id': pid,
                'nombre': p['nombre'],
                'group': gid,
                'subcategoria': p['code'],
                'linea': 'Lumiart',
                'chip1': f"{p.get('watts', '')}W" if p.get('watts') else '',
                'chip2': f"{p.get('lumens', '')} lm" if p.get('lumens') else '',
                'chip3': p.get('color', '') or p.get('base', ''),
                'image': p.get('image', ''),
                'modelo': p['code'],
                'temp': p.get('color', ''),
                'flujo': f"{p.get('lumens', '')} lm" if p.get('lumens') else '',
                'forma': p.get('dimensiones', ''),
            })

    return build_file('Lumiart', 'lumiart', catalog_sections, products_js)


def generate_buffalo():
    items = json.loads((EXTRACTED / 'buffalo-products.json').read_text())
    category_defs = [
        ('pvc-drenaje', 'PVC drenaje DWV', 'Codos, tees, yees y uniones para drenaje sanitario.'),
        ('pvc-presion', 'PVC presión', 'Bujes, codos, tees, tapones y uniones para tubería a presión.'),
        ('pvc-valvulas', 'Válvulas y trampas', 'Válvulas de bola compactas, trampas y sifones de drenaje.'),
        ('cpvc', 'CPVC', 'Accesorios CPVC para agua caliente — codos, tees, uniones y válvulas.'),
        ('forjas', 'Forjas decorativas', 'Paneles, flores, barras, hojas y lanzas de hierro forjado.'),
        ('herrajes-porton', 'Herrajes de portón', 'Rodillos y rieles tipo U para portones corredizos.'),
        ('tornillos', 'Tornillos', 'Tornillos para techo con punta broca — empaque Buffalo.'),
        ('accesorios', 'Accesorios', 'Esponjas multi-uso Buffalo Plus 3W.'),
    ]

    groups_by_cat = OrderedDict()
    group_studio = {}
    for p in items:
        cat = p['category_key']
        gid = p['group_id']
        if cat not in groups_by_cat:
            groups_by_cat[cat] = OrderedDict()
        if gid not in groups_by_cat[cat]:
            groups_by_cat[cat][gid] = {
                'label': p['group_label'],
                'title': p['group_label'],
                'image': p.get('studio_image') or p.get('image', ''),
                'count': 0,
            }
        groups_by_cat[cat][gid]['count'] += 1
        if gid not in group_studio:
            group_studio[gid] = p.get('studio_image') or p.get('image', '')

    catalog_sections = []
    products_js = []

    for cat_id, cat_title, cat_intro in category_defs:
        group_map = groups_by_cat.get(cat_id)
        if not group_map:
            continue
        groups = []
        cover = ''
        for gid, meta in group_map.items():
            if meta['image'] and not cover:
                cover = meta['image']
            groups.append({
                'id': gid,
                'kicker': meta['label'],
                'menuLabel': meta['label'],
                'finderLabel': meta['label'],
                'title': meta['title'],
                'blurb': f'{meta["count"]} medida{"s" if meta["count"] != 1 else ""} en catálogo.',
            })
        linea = {
            'pvc-drenaje': 'Plomería',
            'pvc-presion': 'Plomería',
            'pvc-valvulas': 'Plomería',
            'cpvc': 'Plomería',
            'forjas': 'Herrajes',
            'herrajes-porton': 'Herrajes',
            'tornillos': 'Fijación',
            'accesorios': 'Accesorios',
        }.get(cat_id, 'Buffalo')
        catalog_sections.append({
            'id': cat_id,
            'linea': linea,
            'eyebrow': 'Buffalo',
            'title': cat_title,
            'intro': cat_intro,
            'image': cover,
            'groups': groups,
        })
        for p in items:
            if p['category_key'] != cat_id:
                continue
            pid = slugify(f"buffalo-{p['code']}")
            products_js.append({
                'id': pid,
                'nombre': p['nombre'],
                'group': p['group_id'],
                'subcategoria': f"Ref. {p['code']}",
                'linea': 'Buffalo',
                'medida': p.get('medida', p['code']),
                'image': p.get('image', ''),
                'modelo': p['code'],
            })

    return build_buffalo_file(catalog_sections, products_js, group_studio)


def build_buffalo_file(catalog_sections, products_js, group_studio):
    lines = ['// Catálogo Buffalo — generado desde catálogo fotografiado']
    lines.append(BUFFALO_RUNTIME.strip())
    lines.append('')
    lines.append('const GROUP_STUDIO = {')
    for gid, path in group_studio.items():
        lines.append(f"  {js_str(gid)}: {js_str(path)},")
    lines.append('};')
    lines.append('')
    lines.append('const catalogSections = [')
    for sec in catalog_sections:
        lines.append('  {')
        lines.append(f"    id: {js_str(sec['id'])},")
        lines.append(f"    linea: {js_str(sec['linea'])},")
        lines.append(f"    eyebrow: {js_str(sec['eyebrow'])},")
        lines.append(f"    title: {js_str(sec['title'])},")
        lines.append(f"    intro: {js_str(sec['intro'])},")
        lines.append(f"    image: img({js_str(sec['image'])}),")
        lines.append('    groups: [')
        for g in sec['groups']:
            lines.append('      {')
            for k in ('id', 'kicker', 'menuLabel', 'finderLabel', 'title', 'blurb'):
                lines.append(f"        {k}: {js_str(g[k])},")
            lines.append('      },')
        lines.append('    ],')
        lines.append('  },')
    lines.append('];')
    lines.append('')
    lines.append('const products = [')
    for p in products_js:
        lines.append('  {')
        for k, v in p.items():
            if k == 'image' and v:
                lines.append(f"    image: img({js_str(v)}),")
            else:
                lines.append(f"    {k}: {js_str(v)},")
        lines.append('  },')
    lines.append('];')
    return '\n'.join(lines) + '\n'


def build_file(brand_name, brand_id, catalog_sections, products_js, source='PDF'):
    lines = [f'// Catálogo {brand_name} — generado desde {source}']
    lines.append(GRID_RUNTIME.strip())
    lines.append('')
    lines.append('const catalogSections = [')
    for sec in catalog_sections:
        img_val = sec['image'] if sec['image'].startswith('img(') else f"img({js_str(sec['image'])})"
        lines.append('  {')
        lines.append(f"    id: {js_str(sec['id'])},")
        lines.append(f"    linea: {js_str(sec['linea'])},")
        lines.append(f"    eyebrow: {js_str(sec['eyebrow'])},")
        lines.append(f"    title: {js_str(sec['title'])},")
        lines.append(f"    intro: {js_str(sec['intro'])},")
        lines.append(f"    image: {img_val},")
        lines.append('    groups: [')
        for g in sec['groups']:
            lines.append('      {')
            for k in ('id', 'kicker', 'menuLabel', 'finderLabel', 'title', 'blurb'):
                lines.append(f"        {k}: {js_str(g[k])},")
            lines.append('      },')
        lines.append('    ],')
        lines.append('  },')
    lines.append('];')
    lines.append('')
    lines.append('const products = [')
    for p in products_js:
        lines.append('  {')
        for k, v in p.items():
            if k == 'image' and v:
                lines.append(f"    image: img({js_str(v)}),")
            else:
                lines.append(f"    {k}: {js_str(v)},")
        lines.append('  },')
    lines.append('];')
    lines.append('')
    lines.append('function studioForSpot() { return \'\'; }')
    return '\n'.join(lines) + '\n'


def main():
    celima_js = generate_celima()
    lumiart_js = generate_lumiart()
    buffalo_js = generate_buffalo()
    (ROOT / 'celima/assets/js/products.js').write_text(celima_js, encoding='utf-8')
    (ROOT / 'lumiart/assets/js/products.js').write_text(lumiart_js, encoding='utf-8')
    (ROOT / 'buffalo/assets/js/products.js').write_text(buffalo_js, encoding='utf-8')
    print('Wrote celima, lumiart and buffalo products.js')
    print('Celima products:', celima_js.count('id: \'celima-'))
    print('Lumiart products:', lumiart_js.count('id: \'lumiart-'))
    print('Buffalo products:', buffalo_js.count('id: \'buffalo-'))


if __name__ == '__main__':
    main()
