// Catalog follows the MegaWatt PDF: three chapter cards that open into series,
// then a studio shot and watt pills. Ceiling lights get a redondo/cuadrado toggle.
const img = (file) => (file ? `assets/images/${file}` : '');

const LINEA = {
  bombillos: 'Bombillos',
  empotrables: 'Empotrables',
  emergencia: 'Emergencia',
  calle: 'Alumbrado público',
};

const GROUP_STUDIO = {
  skba: 'catalog/bombillo-smd.jpeg',
  skbt: 'catalog/bombillo-led-alta-potencia.jpeg?v=3',
  skbta: 'catalog/bombillo-industrial.jpeg',
  sknm04: 'catalog/emergencia.jpeg',
  skpl2401: 'catalog/street-light.jpeg',
};

const catalogSections = [
  {
    id: 'bombillos',
    linea: LINEA.bombillos,
    eyebrow: 'Residencial · comercial · industrial',
    title: 'Bombillos LED',
    intro: 'Tres series según la exigencia: SMD para interiores, alta potencia para bodegas y talleres, e industrial de aluminio fundido.',
    image: img('catalog/bombillo-smd.jpeg'),
    groups: [
      {
        id: 'skba',
        kicker: 'SKBA · 7W a 18W',
        menuLabel: 'Bombillos SMD',
        finderLabel: 'SMD Tipo A · 7–18W',
        title: 'Bombillo LED SMD · Tipo A',
        blurb: 'Driver DOB integrado, sin parpadeo y opción de chip SAMSUNG. Uso general en interiores.',
      },
      {
        id: 'skbt',
        kicker: 'SKBT · 20W a 60W',
        menuLabel: 'Alta potencia',
        finderLabel: 'Alta potencia · 20–60W',
        title: 'Bombillo LED alta potencia · Serie T',
        blurb: 'Cuerpo de plástico térmico + aluminio para mayor disipación. Ideal para bodegas, talleres y áreas amplias.',
      },
      {
        id: 'skbta',
        kicker: 'SKBTA · 70W a 100W',
        menuLabel: 'Industrial',
        finderLabel: 'Industrial · 70–100W',
        title: 'Bombillo LED industrial · aluminio fundido',
        blurb: 'Carcasa die-cast de máxima disipación, con protección contra sobretensión opcional. Para naves industriales.',
      },
    ],
  },
  {
    id: 'techo',
    linea: LINEA.empotrables,
    eyebrow: 'Spots',
    title: 'Iluminación de techo',
    intro: 'Paneles empotrables y plafones, en versión redonda y cuadrada.',
    image: img('catalog/panel-slim-redondo.jpeg'),
    hasShapeToggle: true,
    groups: [
      {
        id: 'skrf205',
        kicker: 'SKRF205 · 3W a 18W',
        menuLabel: 'Empotrable slim',
        finderLabel: 'Slim · 3–18W',
        title: 'Panel LED empotrable · slim',
        blurb: 'Plafón ultradelgado (< 25 mm) con driver DOB integrado y carcasa PP ignífuga. Redondo (SKRF205R) y cuadrado (SKRF205S).',
      },
      {
        id: 'skrp',
        kicker: 'SKRP24 / 25 · 3+3W a 18+6W',
        menuLabel: 'Empotrable bicolor',
        finderLabel: 'Bicolor · 3+3 a 18+6W',
        title: 'Panel LED de techo · bicolor',
        blurb: 'Luz principal y borde decorativo de color. Redondo (SKRP24) y cuadrado (SKRP25). El segundo wattage es el borde.',
      },
    ],
  },
  {
    id: 'especiales',
    linea: LINEA.emergencia,
    eyebrow: 'Emergencia · vial',
    title: 'Líneas especiales',
    intro: 'Bombillo recargable para cortes de energía y luminaria vial de alta eficacia.',
    image: img('catalog/emergencia.jpeg'),
    groups: [
      {
        id: 'sknm04',
        kicker: 'SKNM04 · 20W a 40W',
        menuLabel: 'Emergencia',
        finderLabel: 'Recargable · 20–40W',
        title: 'Bombillo LED de emergencia',
        blurb: 'Recargable con batería interna y gancho integrado. Sigue iluminando durante cortes de energía. Luz cálida, neutra o fría.',
      },
      {
        id: 'skpl2401',
        kicker: 'SKPL2401 · 150W a 200W',
        menuLabel: 'Alumbrado público',
        finderLabel: 'Vial · 150–200W',
        title: 'Luminaria LED · alumbrado público',
        blurb: 'Luminaria vial de alta eficacia (> 100 lm/W) para calles, avenidas y áreas exteriores. Cuerpo de aluminio.',
      },
    ],
  },
];

function studioForSpot(group, forma) {
  if (group === 'skrf205') {
    return forma === 'Redondo' ? 'catalog/panel-slim-redondo.jpeg' : 'catalog/panel-slim-cuadrado.jpeg';
  }
  return forma === 'Redondo' ? 'catalog/panel-bicolor-redondo.jpeg' : 'catalog/panel-bicolor-cuadrado.jpeg';
}

function foco({ watts, group, subcategoria, aplicacion, modelo, flujo, tamano }) {
  return {
    id: `foco-led-${watts}w`,
    nombre: `Foco LED ${watts}W`,
    categoria: group === 'skba' ? 'Iluminación Interior' : 'Iluminación Industrial',
    subcategoria,
    tipo: 'Foco LED',
    linea: LINEA.bombillos,
    group,
    modelo,
    potencia: watts + 'W',
    flujo,
    tamano,
    voltaje: '100–265V AC',
    temp: '6500K',
    forma: 'Focos',
    base: group === 'skbta' ? 'E27 / E40' : 'E27',
    aplicacion,
    studio: true,
    image: img(GROUP_STUDIO[group]),
  };
}

function spot({ id, nombre, group, subcategoria, potencia, flujo, tamano, forma, modelo, perforacion }) {
  return {
    id,
    nombre,
    categoria: 'Iluminación Interior',
    subcategoria,
    tipo: 'Spot LED',
    linea: LINEA.empotrables,
    group,
    modelo,
    potencia,
    flujo,
    tamano,
    perforacion,
    voltaje: '100–265V AC',
    temp: '6500K',
    forma,
    aplicacion: 'Interior',
    studio: true,
    image: img(studioForSpot(group, forma)),
  };
}

const products = [
  foco({ watts: 7, group: 'skba', subcategoria: 'SKBA · SMD Tipo A', aplicacion: 'Interior', modelo: 'SKBA-7', flujo: '630 lm', tamano: 'Ø60 × 108 mm' }),
  foco({ watts: 9, group: 'skba', subcategoria: 'SKBA · SMD Tipo A', aplicacion: 'Interior', modelo: 'SKBA-9', flujo: '810 lm', tamano: 'Ø60 × 108 mm' }),
  foco({ watts: 12, group: 'skba', subcategoria: 'SKBA · SMD Tipo A', aplicacion: 'Interior', modelo: 'SKBA-12', flujo: '1,060 lm', tamano: 'Ø60 × 118 mm' }),
  foco({ watts: 15, group: 'skba', subcategoria: 'SKBA · SMD Tipo A', aplicacion: 'Interior', modelo: 'SKBA-15', flujo: '1,350 lm', tamano: 'Ø60 × 122 mm' }),
  foco({ watts: 18, group: 'skba', subcategoria: 'SKBA · SMD Tipo A', aplicacion: 'Interior', modelo: 'SKB100-18', flujo: '1,600 lm', tamano: 'Ø70 × 132 mm' }),

  foco({ watts: 20, group: 'skbt', subcategoria: 'SKBT · Alta potencia', aplicacion: 'Industrial', modelo: 'SKBT-20', flujo: '1,800 lm', tamano: 'Ø80 × 131 mm' }),
  foco({ watts: 30, group: 'skbt', subcategoria: 'SKBT · Alta potencia', aplicacion: 'Industrial', modelo: 'SKBT-30', flujo: '2,700 lm', tamano: 'Ø100 × 155 mm' }),
  foco({ watts: 40, group: 'skbt', subcategoria: 'SKBT · Alta potencia', aplicacion: 'Industrial', modelo: 'SKBT-40', flujo: '3,600 lm', tamano: 'Ø120 × 185 mm' }),
  foco({ watts: 50, group: 'skbt', subcategoria: 'SKBT · Alta potencia', aplicacion: 'Industrial', modelo: 'SKBT-50', flujo: '4,500 lm', tamano: 'Ø140 × 205 mm' }),
  foco({ watts: 60, group: 'skbt', subcategoria: 'SKBT · Alta potencia', aplicacion: 'Industrial', modelo: 'SKBT-60', flujo: '5,400 lm', tamano: 'Ø160 × 290 mm' }),

  foco({ watts: 70, group: 'skbta', subcategoria: 'SKBTA · Industrial', aplicacion: 'Industrial', modelo: 'SKBTA-70', flujo: '5,600 lm', tamano: 'Ø140 × 230 mm' }),
  foco({ watts: 80, group: 'skbta', subcategoria: 'SKBTA · Industrial', aplicacion: 'Industrial', modelo: 'SKBTA-80', flujo: '6,400 lm', tamano: 'Ø140 × 230 mm' }),
  foco({ watts: 100, group: 'skbta', subcategoria: 'SKBTA · Industrial', aplicacion: 'Industrial', modelo: 'SKBTA-100', flujo: '8,000 lm', tamano: 'Ø150 × 260 mm' }),

  spot({ id: 'spot-redondo-3w', nombre: 'Spot redondo 3W', group: 'skrf205', subcategoria: 'SKRF205R · Slim', potencia: '3W', flujo: '180 lm', tamano: 'Ø98 mm', perforacion: 'Ø77–82 mm', forma: 'Redondo', modelo: 'SKRF205R-3' }),
  spot({ id: 'spot-redondo-6w', nombre: 'Spot redondo 6W', group: 'skrf205', subcategoria: 'SKRF205R · Slim', potencia: '6W', flujo: '360 lm', tamano: 'Ø118 mm', perforacion: 'Ø95–100 mm', forma: 'Redondo', modelo: 'SKRF205R-6' }),
  spot({ id: 'spot-redondo-12w', nombre: 'Spot redondo 12W', group: 'skrf205', subcategoria: 'SKRF205R · Slim', potencia: '12W', flujo: '720 lm', tamano: 'Ø145 mm', perforacion: 'Ø118–128 mm', forma: 'Redondo', modelo: 'SKRF205R-12' }),
  spot({ id: 'spot-redondo-18w', nombre: 'Spot redondo 18W', group: 'skrf205', subcategoria: 'SKRF205R · Slim', potencia: '18W', flujo: '1,260 lm', tamano: 'Ø175 mm', perforacion: 'Ø145–155 mm', forma: 'Redondo', modelo: 'SKRF205R-18' }),
  spot({ id: 'spot-cuadrado-3w', nombre: 'Spot cuadrado 3W', group: 'skrf205', subcategoria: 'SKRF205S · Slim', potencia: '3W', flujo: '180 lm', tamano: '98×98 mm', perforacion: 'Ø77–82 mm', forma: 'Cuadrado', modelo: 'SKRF205S-3' }),
  spot({ id: 'spot-cuadrado-6w', nombre: 'Spot cuadrado 6W', group: 'skrf205', subcategoria: 'SKRF205S · Slim', potencia: '6W', flujo: '360 lm', tamano: '118×118 mm', perforacion: 'Ø95–100 mm', forma: 'Cuadrado', modelo: 'SKRF205S-6' }),
  spot({ id: 'spot-cuadrado-12w', nombre: 'Spot cuadrado 12W', group: 'skrf205', subcategoria: 'SKRF205S · Slim', potencia: '12W', flujo: '720 lm', tamano: '145×145 mm', perforacion: 'Ø118–128 mm', forma: 'Cuadrado', modelo: 'SKRF205S-12' }),
  spot({ id: 'spot-cuadrado-18w', nombre: 'Spot cuadrado 18W', group: 'skrf205', subcategoria: 'SKRF205S · Slim', potencia: '18W', flujo: '1,260 lm', tamano: '175×175 mm', perforacion: 'Ø145–155 mm', forma: 'Cuadrado', modelo: 'SKRF205S-18' }),

  spot({ id: 'spot-redondo-color-3-3w', nombre: 'Spot redondo color 3+3W', group: 'skrp', subcategoria: 'SKRP24 · Bicolor', potencia: '3+3W', tamano: 'Ø105 mm', perforacion: 'Ø75 mm', forma: 'Redondo', modelo: 'SKRP24-3+3' }),
  spot({ id: 'spot-redondo-color-6-3w', nombre: 'Spot redondo color 6+3W', group: 'skrp', subcategoria: 'SKRP24 · Bicolor', potencia: '6+3W', tamano: 'Ø145 mm', perforacion: 'Ø105 mm', forma: 'Redondo', modelo: 'SKRP24-6+3' }),
  spot({ id: 'spot-redondo-color-12-4w', nombre: 'Spot redondo color 12+4W', group: 'skrp', subcategoria: 'SKRP24 · Bicolor', potencia: '12+4W', tamano: 'Ø195 mm', perforacion: 'Ø155 mm', forma: 'Redondo', modelo: 'SKRP24-12+4' }),
  spot({ id: 'spot-redondo-color-18-6w', nombre: 'Spot redondo color 18+6W', group: 'skrp', subcategoria: 'SKRP24 · Bicolor', potencia: '18+6W', tamano: 'Ø245 mm', perforacion: 'Ø210 mm', forma: 'Redondo', modelo: 'SKRP24-18+6' }),
  spot({ id: 'spot-cuadrado-color-3-3w', nombre: 'Spot cuadrado color 3+3W', group: 'skrp', subcategoria: 'SKRP25 · Bicolor', potencia: '3+3W', tamano: '105×105 mm', perforacion: 'Ø75 mm', forma: 'Cuadrado', modelo: 'SKRP25-3+3' }),
  spot({ id: 'spot-cuadrado-color-6-3w', nombre: 'Spot cuadrado color 6+3W', group: 'skrp', subcategoria: 'SKRP25 · Bicolor', potencia: '6+3W', tamano: '145×145 mm', perforacion: 'Ø105 mm', forma: 'Cuadrado', modelo: 'SKRP25-6+3' }),
  spot({ id: 'spot-cuadrado-color-12-4w', nombre: 'Spot cuadrado color 12+4W', group: 'skrp', subcategoria: 'SKRP25 · Bicolor', potencia: '12+4W', tamano: '195×195 mm', perforacion: 'Ø155 mm', forma: 'Cuadrado', modelo: 'SKRP25-12+4' }),
  spot({ id: 'spot-cuadrado-color-18-6w', nombre: 'Spot cuadrado color 18+6W', group: 'skrp', subcategoria: 'SKRP25 · Bicolor', potencia: '18+6W', tamano: '245×245 mm', perforacion: 'Ø210 mm', forma: 'Cuadrado', modelo: 'SKRP25-18+6' }),

  {
    id: 'bombillo-led-de-emergencia',
    nombre: 'Bombillo de emergencia 20W',
    categoria: 'Iluminación de Emergencia',
    subcategoria: 'SKNM04 · Recargable',
    tipo: 'Bombillo LED de Emergencia',
    linea: LINEA.emergencia,
    group: 'sknm04',
    modelo: 'SKNM04-20W',
    potencia: '20W',
    tamano: 'Ø95 × 165 mm',
    autonomia: '3–4 h',
    voltaje: 'DC 5V (USB)',
    temp: '2700K / 4000K / 6000K',
    forma: '—',
    aplicacion: 'Emergencia',
    studio: true,
    image: img(GROUP_STUDIO.sknm04),
  },
  {
    id: 'bombillo-led-de-emergencia-30w',
    nombre: 'Bombillo de emergencia 30W',
    categoria: 'Iluminación de Emergencia',
    subcategoria: 'SKNM04 · Recargable',
    tipo: 'Bombillo LED de Emergencia',
    linea: LINEA.emergencia,
    group: 'sknm04',
    modelo: 'SKNM04-30W',
    potencia: '30W',
    tamano: 'Ø105 × 170 mm',
    autonomia: '4–6 h',
    voltaje: 'DC 5V (USB)',
    temp: '2700K / 4000K / 6000K',
    forma: '—',
    aplicacion: 'Emergencia',
    studio: true,
    image: img(GROUP_STUDIO.sknm04),
  },
  {
    id: 'bombillo-led-de-emergencia-40w',
    nombre: 'Bombillo de emergencia 40W',
    categoria: 'Iluminación de Emergencia',
    subcategoria: 'SKNM04 · Recargable',
    tipo: 'Bombillo LED de Emergencia',
    linea: LINEA.emergencia,
    group: 'sknm04',
    modelo: 'SKNM04-40W',
    potencia: '40W',
    tamano: 'Ø105 × 170 mm',
    autonomia: '4–6 h',
    voltaje: 'DC 5V (USB)',
    temp: '2700K / 4000K / 6000K',
    forma: '—',
    aplicacion: 'Emergencia',
    studio: true,
    image: img(GROUP_STUDIO.sknm04),
  },

  {
    id: 'led-street-light-150w',
    nombre: 'LED Street Light 150W',
    categoria: 'Iluminación Exterior',
    subcategoria: 'SKPL2401 · Alumbrado público',
    tipo: 'Lámpara LED de Calle',
    linea: LINEA.calle,
    group: 'skpl2401',
    modelo: 'SKPL2401-150W',
    potencia: '150W',
    flujo: '> 100 lm/W',
    tamano: '166.5 × 580.7 × 73.3 mm',
    voltaje: '100–265V AC',
    temp: '6500K',
    forma: '—',
    aplicacion: 'Exterior',
    studio: true,
    image: img(GROUP_STUDIO.skpl2401),
  },
  {
    id: 'led-street-light-200w',
    nombre: 'LED Street Light 200W',
    categoria: 'Iluminación Exterior',
    subcategoria: 'SKPL2401 · Alumbrado público',
    tipo: 'Lámpara LED de Calle',
    linea: LINEA.calle,
    group: 'skpl2401',
    modelo: 'SKPL2401-200W',
    potencia: '200W',
    flujo: '> 100 lm/W',
    tamano: '196.4 × 655.7 × 73.3 mm',
    voltaje: '100–265V AC',
    temp: '6500K',
    forma: '—',
    aplicacion: 'Exterior',
    studio: true,
    image: img(GROUP_STUDIO.skpl2401),
  },
];

function wattSortValue(value) {
  const nums = String(value).match(/\d+/g);
  if (!nums) return 0;
  return Number(nums[0]) + (nums[1] ? Number(nums[1]) / 100 : 0);
}

const catalogState = {
  category: '',
  series: '',
  shape: 'Redondo',
  watt: '',
};

function isVideoPath(path) {
  return /\.(mp4|webm|mov)$/i.test(path || '');
}

function productPhotoHtml(product) {
  if (!product.image) {
    return '<span>Foto pendiente</span>';
  }
  if (isVideoPath(product.image)) {
    return `<video src="${product.image}" muted defaultMuted playsinline loop autoplay preload="metadata" aria-label="${product.nombre}"></video>`;
  }
  return `<img src="${product.image}" alt="${product.nombre}" loading="lazy">`;
}

function specChipsHtml(p) {
  const chips = [];
  if (p.temp) chips.push(p.temp);
  if (p.flujo) chips.push(p.flujo);
  if (p.autonomia) chips.push(p.autonomia);
  if (p.forma && p.forma !== '—' && p.forma !== 'Focos') chips.push(p.forma);
  if (p.base) chips.push(p.base);
  return chips.map((chip) => `<span>${chip}</span>`).join('');
}

const featuredProductNames = [
  'Foco LED 9W',
  'Foco LED 40W',
  'Foco LED 80W',
  'Spot redondo 12W',
  'Spot cuadrado color 6+3W',
  'Bombillo de emergencia 20W',
  'LED Street Light 150W',
];

function getFeaturedProducts() {
  return featuredProductNames
    .map((name) => products.find((p) => p.nombre === name))
    .filter(Boolean);
}

function cartQtyForProduct(id) {
  if (typeof getCartQty !== 'function') return 0;
  return getCartQty(id);
}

function addToCartButtonHtml(p) {
  const qty = cartQtyForProduct(p.id);
  const inCart = qty > 0;
  return `
    <button
      type="button"
      class="add-to-cart-btn${inCart ? ' is-in-cart' : ''}"
      data-product-id="${p.id}"
      aria-label="${inCart ? `Agregar otra unidad de ${p.nombre}` : `Agregar ${p.nombre} al carrito`}"
    >${inCart ? `En el carrito · ${qty}` : 'Agregar'}</button>
  `;
}

function featuredCardHtml(p) {
  return `
    <div class="product-card featured-card" data-product-id="${p.id}">
      <div class="p-photo featured-photo is-studio">${productPhotoHtml(p)}</div>
      <div class="p-body">
        <div class="p-cat">${p.subcategoria}</div>
        <h4>${p.nombre}</h4>
        <div class="p-specs">
          ${specChipsHtml(p)}
        </div>
        ${addToCartButtonHtml(p)}
      </div>
    </div>
  `;
}

function refreshProductCardButtons() {
  document.querySelectorAll('.add-to-cart-btn[data-product-id]').forEach((btn) => {
    const id = btn.dataset.productId;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const qty = cartQtyForProduct(id);
    const inCart = qty > 0;
    btn.classList.toggle('is-in-cart', inCart);
    btn.textContent = inCart ? `En el carrito · ${qty}` : 'Agregar';
    btn.setAttribute(
      'aria-label',
      inCart ? `Agregar otra unidad de ${product.nombre}` : `Agregar ${product.nombre} al carrito`
    );
  });
}

function categoryMeta(categoryId) {
  return catalogSections.find((section) => section.id === categoryId) || null;
}

function groupMeta(groupId) {
  for (const section of catalogSections) {
    const group = section.groups.find((entry) => entry.id === groupId);
    if (group) return { ...group, categoryId: section.id, hasShapeToggle: Boolean(section.hasShapeToggle) };
  }
  return null;
}

function seriesImage(groupId, shape) {
  if (groupId === 'skrf205' || groupId === 'skrp') {
    return img(studioForSpot(groupId, shape || catalogState.shape));
  }
  return img(GROUP_STUDIO[groupId] || '');
}

function seriesProducts(groupId) {
  const meta = groupMeta(groupId);
  return products
    .filter((p) => p.group === groupId)
    .filter((p) => !meta?.hasShapeToggle || p.forma === catalogState.shape)
    .sort((a, b) => wattSortValue(a.potencia) - wattSortValue(b.potencia));
}

function selectedProduct() {
  if (!catalogState.series || !catalogState.watt) return null;
  return (
    seriesProducts(catalogState.series).find((p) => p.potencia === catalogState.watt) || null
  );
}

function specRows(product) {
  const rows = [
    ['Modelo', product.modelo],
    ['Potencia', product.potencia],
    ['Flujo luminoso', product.flujo],
    ['Voltaje', product.voltaje],
    ['Temp. color', product.temp],
    ['Base', product.base],
    ['Forma', product.forma && product.forma !== '—' && product.forma !== 'Focos' ? product.forma : ''],
    ['Tamaño', product.tamano],
    ['Perforación', product.perforacion],
    ['Autonomía', product.autonomia],
  ];
  return rows.filter(([, value]) => value);
}

function wattPillsHtml(items) {
  return `
    <div class="watt-pills" role="listbox" aria-label="Potencia">
      ${items
        .map(
          (product) => `
        <button
          type="button"
          class="watt-pill${catalogState.watt === product.potencia ? ' is-selected' : ''}"
          data-watt="${product.potencia}"
          aria-pressed="${catalogState.watt === product.potencia}"
        >${product.potencia}</button>`
        )
        .join('')}
    </div>
  `;
}

function shapeToggleHtml() {
  return `
    <div class="shape-toggle" role="group" aria-label="Forma">
      <span class="shape-toggle-label">Forma</span>
      <div class="shape-toggle-track">
        ${['Redondo', 'Cuadrado']
          .map(
            (shape) => `
          <button
            type="button"
            class="shape-toggle-btn${catalogState.shape === shape ? ' is-selected' : ''}"
            data-shape="${shape}"
            aria-pressed="${catalogState.shape === shape}"
          >${shape}</button>`
          )
          .join('')}
      </div>
    </div>
  `;
}

function seriesDetailHtml(group) {
  const items = seriesProducts(group.id);
  const product = selectedProduct();
  const photoSrc = product ? product.image : seriesImage(group.id);
  const photo = product
    ? productPhotoHtml(product)
    : photoSrc
      ? `<img src="${photoSrc}" alt="${group.title}">`
      : '';

  const rows = product
    ? specRows(product)
        .map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`)
        .join('')
    : '';

  return `
    <div class="series-detail">
      <div class="finder-photo">${photo}</div>
      <div class="finder-copy">
        <div class="p-cat">${group.kicker}</div>
        <h3>${group.title}</h3>
        <p>${group.blurb}</p>
        <div class="watt-block">
          <div class="watt-label">Potencia</div>
          ${wattPillsHtml(items)}
        </div>
        ${
          product
            ? `<table class="finder-specs"><tbody>${rows}</tbody></table>${addToCartButtonHtml(product)}`
            : '<p class="finder-hint">Elige los watts para ver el modelo exacto.</p>'
        }
      </div>
    </div>
  `;
}

function seriesCardHtml(group) {
  const selected = catalogState.series === group.id;
  return `
    <button type="button" class="series-card${selected ? ' is-selected' : ''}" data-series="${group.id}">
      <span class="series-card-thumb">
        <img src="${seriesImage(group.id)}" alt="">
      </span>
      <span class="series-card-copy">
        <span class="p-cat">${group.kicker}</span>
        <span class="series-card-title">${group.title}</span>
      </span>
    </button>
  `;
}

function categoryCardHtml(section) {
  const open = catalogState.category === section.id;
  const note = section.eyebrow === 'Spots' ? ' <span class="cat-note">(spots)</span>' : '';
  return `
    <article class="cat-card${open ? ' is-open' : ''}" data-category="${section.id}">
      <button type="button" class="cat-card-toggle" data-category="${section.id}" aria-expanded="${open}">
        <span class="cat-card-thumb">
          <img src="${section.image}" alt="">
        </span>
        <span class="cat-card-copy">
          <span class="eyebrow">${section.eyebrow}</span>
          <span class="cat-card-title">${section.title}${note}</span>
          <span class="cat-card-intro">${section.intro}</span>
        </span>
        <span class="cat-card-chevron" aria-hidden="true">${open ? '−' : '+'}</span>
      </button>
      ${
        open
          ? `
        <div class="cat-card-body">
          ${section.hasShapeToggle ? shapeToggleHtml() : ''}
          <div class="series-grid series-grid--${section.groups.length}">
            ${section.groups.map(seriesCardHtml).join('')}
          </div>
          ${catalogState.series && groupMeta(catalogState.series)?.categoryId === section.id
            ? seriesDetailHtml(groupMeta(catalogState.series))
            : ''}
        </div>`
          : ''
      }
    </article>
  `;
}

function catalogTreeHtml() {
  return catalogSections.map(categoryCardHtml).join('');
}

function toggleCategory(categoryId) {
  if (catalogState.category === categoryId) {
    catalogState.category = '';
    catalogState.series = '';
    catalogState.watt = '';
  } else {
    catalogState.category = categoryId;
    catalogState.series = '';
    catalogState.watt = '';
  }
  renderCatalog();
}

function toggleSeries(seriesId) {
  if (catalogState.series === seriesId) {
    catalogState.series = '';
    catalogState.watt = '';
  } else {
    catalogState.series = seriesId;
    catalogState.watt = '';
  }
  renderCatalog();
}

function setShape(shape) {
  catalogState.shape = shape;
  const stillValid = seriesProducts(catalogState.series).some((p) => p.potencia === catalogState.watt);
  if (!stillValid) catalogState.watt = '';
  renderCatalog();
}

function setWatt(watt) {
  catalogState.watt = watt;
  renderCatalog();
}

function renderCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;
  root.innerHTML = catalogTreeHtml();
  if (typeof refreshProductCardButtons === 'function') {
    refreshProductCardButtons();
  }
}

function initCatalog() {
  const root = document.getElementById('catalogTree');
  if (!root) return;

  root.addEventListener('click', (e) => {
    const watt = e.target.closest('.watt-pill');
    if (watt) {
      setWatt(watt.dataset.watt);
      return;
    }

    const shape = e.target.closest('.shape-toggle-btn');
    if (shape) {
      setShape(shape.dataset.shape);
      return;
    }

    const series = e.target.closest('.series-card');
    if (series) {
      toggleSeries(series.dataset.series);
      return;
    }

    const category = e.target.closest('.cat-card-toggle');
    if (category) {
      toggleCategory(category.dataset.category);
    }
  });

  renderCatalog();
}

function renderFeaturedCarousel() {
  const track = document.getElementById('featuredTrack');
  if (!track) return;

  const featured = getFeaturedProducts();
  if (!featured.length) return;

  const cards = featured.map(featuredCardHtml).join('');
  track.innerHTML = cards + cards;
}

function initFeatured() {
  renderFeaturedCarousel();
}
