// Catálogo Trébol — generado desde losa sanitaria
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
    return `<video src="${product.image}" muted defaultMuted playsinline loop autoplay preload="metadata" aria-label="${product.nombre}"></video>`;
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

const catalogSections = [
  {
    id: "losa-sanitaria",
    linea: "Losa sanitaria",
    eyebrow: "Trébol",
    title: "Losa sanitaria",
    intro: "Inodoros, lavamanos y urinarios del catálogo fotográfico.",
    image: img("catalog/products/sanitario/10591.jpeg"),
    groups: [
      {
        id: "losa-sanitaria-urinarios",
        kicker: "Urinarios",
        menuLabel: "Urinarios",
        finderLabel: "Urinarios",
        title: "Urinarios",
        blurb: "1 referencias en urinarios.",
      },
      {
        id: "losa-sanitaria-lavamanos",
        kicker: "Lavamanos",
        menuLabel: "Lavamanos",
        finderLabel: "Lavamanos",
        title: "Lavamanos",
        blurb: "13 referencias en lavamanos.",
      },
      {
        id: "losa-sanitaria-inodoros",
        kicker: "Inodoros",
        menuLabel: "Inodoros",
        finderLabel: "Inodoros",
        title: "Inodoros",
        blurb: "4 referencias en inodoros.",
      },
    ],
  },
];

const products = [
  {
    id: "trebol-san-10591",
    nombre: "URINARIO SAHARA BLANCO",
    group: "losa-sanitaria-urinarios",
    subcategoria: "Ref. 10591",
    linea: "Trébol",
    chip1: "Consultar",
    chip2: "Urinarios",
    chip3: "",
    image: img("catalog/products/sanitario/10591.jpeg"),
    modelo: "10591",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-10703",
    nombre: "LAVAM. REKTUM NEGRO A423-CBK-M 38.5X38.5X14CM + DESAGUE BN",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 10703",
    linea: "Trébol",
    chip1: "38.5X38.5X14CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/10703.jpeg"),
    modelo: "10703",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-11177",
    nombre: "LAVAM. BASIN ROUND WHITE 46X46X16.5CM TO207",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 11177",
    linea: "Trébol",
    chip1: "46X46X16.5CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/11177.jpeg"),
    modelo: "11177",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-11178",
    nombre: "LAVAM. BASIN ZOE WHITE 49X38X13CM TO233",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 11178",
    linea: "Trébol",
    chip1: "49X38X13CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/11178.jpeg"),
    modelo: "11178",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12173",
    nombre: "LAVAMANOS AGNES BY-8418 / 60X42X17CM (SOBRE PONER)",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12173",
    linea: "Trébol",
    chip1: "60X42X17CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12173.jpeg"),
    modelo: "12173",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12183l",
    nombre: "LAVAMANOS LUNA BLANCO SOBRE- PONER 39X39X15 CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12183L",
    linea: "Trébol",
    chip1: "39X39X15 CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12183l.jpeg"),
    modelo: "12183L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12185l",
    nombre: "LAVAMANOS SAMOA BLANCO SOBRE- PONER 43.5X35.5X9 CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12185L",
    linea: "Trébol",
    chip1: "43.5X35.5X9 CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12185l.jpeg"),
    modelo: "12185L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12186l",
    nombre: "LAVAMANOS DIVANI BLANCO SOBRE- PONER 42.5X42.5X15 CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12186L",
    linea: "Trébol",
    chip1: "42.5X42.5X15 CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12186l.jpeg"),
    modelo: "12186L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12187l",
    nombre: "LAVAMANOS SONNET BLANCO SOBRE- ENCIMERA 47.5X 42 X1.70CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12187L",
    linea: "Trébol",
    chip1: "47.5X 42 X1.70CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12187l.jpeg"),
    modelo: "12187L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12188l",
    nombre: "LAVAMANOS CERALUX BLANCO SOBRE- ENCIMERA 58.5 X45.5X 1.70CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12188L",
    linea: "Trébol",
    chip1: "58.5 X45.5X 1.70CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12188l.jpeg"),
    modelo: "12188L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12189l",
    nombre: "LAVAMANOS MINBELL BLANCO BAJO- ENCIMERA 47.5 X 40.5X 13.5 CM",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12189L",
    linea: "Trébol",
    chip1: "47.5 X 40.5X 13.5 CM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12189l.jpeg"),
    modelo: "12189L",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12197",
    nombre: "LAVAMANOS OVAL BLANCO 455X320X135MM BR 168B",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12197",
    linea: "Trébol",
    chip1: "455X320X135MM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12197.jpeg"),
    modelo: "12197",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12198",
    nombre: "LAVAMANOS BOWL BLANCO 420X420X160MM BR 107",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12198",
    linea: "Trébol",
    chip1: "420X420X160MM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12198.jpeg"),
    modelo: "12198",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12199",
    nombre: "LAVAMANOS BOWL GREY (107-GRAY) 420X420X160MM BR 107",
    group: "losa-sanitaria-lavamanos",
    subcategoria: "Ref. 12199",
    linea: "Trébol",
    chip1: "420X420X160MM",
    chip2: "Lavamanos",
    chip3: "",
    image: img("catalog/products/sanitario/12199.jpeg"),
    modelo: "12199",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-11533",
    nombre: "INODORO RAPID JET BLANCO PALANCA SANDWICH (TAZA + TANQUE + A",
    group: "losa-sanitaria-inodoros",
    subcategoria: "Ref. 11533",
    linea: "Trébol",
    chip1: "Consultar",
    chip2: "Inodoros",
    chip3: "",
    image: img("catalog/products/sanitario/11533.jpeg"),
    modelo: "11533",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12016",
    nombre: "INODORO MAGNET BY2435 ONE PIECE BLANCO 690 X 370 X 770 MM BR",
    group: "losa-sanitaria-inodoros",
    subcategoria: "Ref. 12016",
    linea: "Trébol",
    chip1: "690 X 370 X 770 MM",
    chip2: "Inodoros",
    chip3: "",
    image: img("catalog/products/sanitario/12016.jpeg"),
    modelo: "12016",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12195",
    nombre: "INODORO GEBBO 2540 ONE PIECE BLANCO 705X390X750MM BR",
    group: "losa-sanitaria-inodoros",
    subcategoria: "Ref. 12195",
    linea: "Trébol",
    chip1: "705X390X750MM",
    chip2: "Inodoros",
    chip3: "",
    image: img("catalog/products/sanitario/12195.jpeg"),
    modelo: "12195",
    linea_cat: "Trébol",
  },
  {
    id: "trebol-san-12257",
    nombre: "INODORO AKIM BLACK BY-2378-2 ONE PIECE 720X380X760MM BR",
    group: "losa-sanitaria-inodoros",
    subcategoria: "Ref. 12257",
    linea: "Trébol",
    chip1: "720X380X760MM",
    chip2: "Inodoros",
    chip3: "",
    image: img("catalog/products/sanitario/12257.jpeg"),
    modelo: "12257",
    linea_cat: "Trébol",
  },
];

function studioForSpot() { return ''; }
