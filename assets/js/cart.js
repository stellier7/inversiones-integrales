/** Portal-wide quote cart — shared across main page and all brands. */

const CART_STORAGE_KEY = 'ii-cart';
const CART_EVENT = 'ii:cart';

const BRAND_NAMES = {
  megawatt: 'MegaWatt',
  lumiart: 'Lumiart',
  buffalo: 'Buffalo',
  zafiro: 'Zafiro',
  celima: 'Celima',
  trebol: 'Trébol',
};

const LEGACY_CART_KEYS = [
  'megawatt-cart',
  'buffalo-cart',
  'zafiro-cart',
  'celima-cart',
  'trebol-cart',
  'lumiart-cart',
];

/** @type {{ brand: string, id: string, qty: number, snapshot: object }[]} */
let cartItems = [];

function getCurrentBrand() {
  const match = window.location.pathname.match(/^\/(megawatt|buffalo|zafiro|celima|trebol|lumiart)\/?/);
  return match ? match[1] : null;
}

function normalizeImagePath(image, brand) {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/')) return image;
  return `/${brand}/${image}`;
}

function productSnapshot(product, brand) {
  return {
    nombre: product.nombre,
    image: normalizeImagePath(product.image, brand),
    temp: product.temp || '',
    flujo: product.flujo || '',
    forma: product.forma || '',
    linea: product.linea || '',
  };
}

function migrateLegacyCarts() {
  if (localStorage.getItem(CART_STORAGE_KEY)) return;

  const merged = [];
  LEGACY_CART_KEYS.forEach((key) => {
    const brand = key.replace('-cart', '');
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const items = JSON.parse(raw);
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (!item || typeof item.id !== 'string' || Number(item.qty) < 1) return;
        merged.push({
          brand,
          id: item.id,
          qty: Math.min(999, Math.floor(Number(item.qty)) || 1),
          snapshot: { nombre: item.id, image: '', temp: '', flujo: '', forma: '', linea: '' },
        });
      });
    } catch {
      /* ignore */
    }
  });

  if (merged.length) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(merged));
  }
}

function normalizeCartItem(raw) {
  if (!raw || typeof raw.id !== 'string' || Number(raw.qty) < 1) return null;

  if (raw.brand && raw.snapshot) {
    return {
      brand: raw.brand,
      id: raw.id,
      qty: Math.min(999, Math.max(1, Math.floor(Number(raw.qty)) || 1)),
      snapshot: raw.snapshot,
    };
  }

  const brand = raw.brand || getCurrentBrand() || 'megawatt';
  return {
    brand,
    id: raw.id,
    qty: Math.min(999, Math.max(1, Math.floor(Number(raw.qty)) || 1)),
    snapshot: raw.snapshot || { nombre: raw.id, image: '', temp: '', flujo: '', forma: '', linea: '' },
  };
}

function loadCart() {
  migrateLegacyCarts();
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      cartItems = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cartItems = [];
      return;
    }
    cartItems = parsed.map(normalizeCartItem).filter(Boolean);
  } catch {
    cartItems = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  document.dispatchEvent(new CustomEvent(CART_EVENT));
}

function findCartItem(brand, id) {
  return cartItems.find((entry) => entry.brand === brand && entry.id === id);
}

function getCartQty(id, brand = getCurrentBrand()) {
  if (!brand) return 0;
  const item = findCartItem(brand, id);
  return item ? item.qty : 0;
}

function getCartTotalUnits() {
  return cartItems.reduce((sum, item) => sum + item.qty, 0);
}

function refreshSnapshotsForCurrentBrand() {
  const brand = getCurrentBrand();
  if (!brand || typeof products === 'undefined') return;

  let changed = false;
  cartItems.forEach((item) => {
    if (item.brand !== brand) return;
    const product = products.find((p) => p.id === item.id);
    if (product) {
      item.snapshot = productSnapshot(product, brand);
      changed = true;
    }
  });

  if (changed) saveCart();
}

function getCartLines() {
  return cartItems
    .map((item) => ({
      brand: item.brand,
      id: item.id,
      qty: item.qty,
      product: item.snapshot ? { ...item.snapshot, id: item.id } : null,
    }))
    .filter((line) => line.product);
}

function addToCart(id, amount = 1) {
  const brand = getCurrentBrand();
  if (!brand || !id) return;
  if (typeof products === 'undefined') return;

  const product = products.find((p) => p.id === id);
  if (!product) return;

  const delta = Math.max(1, Math.floor(Number(amount)) || 1);
  const existing = findCartItem(brand, id);
  if (existing) {
    existing.qty = Math.min(999, existing.qty + delta);
    existing.snapshot = productSnapshot(product, brand);
  } else {
    cartItems.push({
      brand,
      id,
      qty: Math.min(999, delta),
      snapshot: productSnapshot(product, brand),
    });
  }
  saveCart();
}

function setQty(brand, id, qty) {
  const next = Math.floor(Number(qty));
  if (!brand || !id) return;
  if (!Number.isFinite(next) || next < 1) {
    removeFromCart(brand, id);
    return;
  }
  const existing = findCartItem(brand, id);
  if (existing) {
    existing.qty = Math.min(999, next);
  }
  saveCart();
}

function removeFromCart(brand, id) {
  cartItems = cartItems.filter((entry) => !(entry.brand === brand && entry.id === id));
  saveCart();
}

function clearCart() {
  cartItems = [];
  saveCart();
}

function cartQuoteGreeting() {
  const seller = typeof getActiveSeller === 'function' ? getActiveSeller() : null;
  if (seller) {
    return `Hola ${seller.firstName}, quiero cotizar estos productos y confirmar disponibilidad:`;
  }
  return 'Hola, quiero cotizar estos productos y confirmar disponibilidad:';
}

function cartDestinationLabel() {
  const seller = typeof getActiveSeller === 'function' ? getActiveSeller() : null;
  if (seller) return seller.firstName;
  return 'Inversiones Integrales';
}

function formatCartLineSpecs(product) {
  const parts = [];
  if (product.temp) parts.push(product.temp);
  if (product.flujo) parts.push(product.flujo);
  if (product.forma && product.forma !== '—') parts.push(product.forma);
  if (product.linea) parts.push(product.linea);
  return parts.join(' · ');
}

function quantityLabel(qty) {
  return qty === 1 ? '1 unidad' : `${qty} unidades`;
}

function buildCartQuoteMessage() {
  const lines = getCartLines();
  const body = lines.map((line, index) => {
    const brandLabel = BRAND_NAMES[line.brand] || line.brand;
    return `${index + 1}. [${brandLabel}] ${line.product.nombre} — ${quantityLabel(line.qty)}`;
  });

  return [cartQuoteGreeting(), '', ...body, '', '¿Me confirmas precios y disponibilidad? Gracias.'].join('\n');
}

function submitCartQuote() {
  const lines = getCartLines();
  if (!lines.length) return;
  if (typeof whatsAppUrl === 'function') {
    window.open(whatsAppUrl(buildCartQuoteMessage()), '_blank', 'noopener');
  }
}

function updateCartDestinationCopy() {
  const sub = document.querySelector('.cart-drawer-sub');
  const quoteBtn = document.getElementById('cartQuoteBtn');
  const seller = typeof getActiveSeller === 'function' ? getActiveSeller() : null;
  const destination = cartDestinationLabel();

  if (sub) {
    sub.textContent = seller
      ? `La lista se envía a ${destination} por WhatsApp para cotizar y confirmar disponibilidad.`
      : 'Arma la lista y envíala por WhatsApp para cotizar.';
  }
  if (quoteBtn) {
    quoteBtn.textContent = seller
      ? `Pedir cotización a ${destination}`
      : 'Pedir cotización por WhatsApp';
  }
}

function cartThumbHtml(product) {
  if (!product.image) {
    return '<div class="cart-line-thumb is-placeholder" aria-hidden="true"></div>';
  }
  if (typeof isVideoPath === 'function' && isVideoPath(product.image)) {
    return `<div class="cart-line-thumb"><video src="${product.image}" muted playsinline loop autoplay preload="metadata" aria-hidden="true"></video></div>`;
  }
  return `<div class="cart-line-thumb"><img src="${product.image}" alt="" loading="lazy"></div>`;
}

function cartLineHtml(line) {
  const { product, qty, id, brand } = line;
  const brandLabel = BRAND_NAMES[brand] || brand;
  return `
    <li class="cart-line" data-brand="${brand}" data-product-id="${id}">
      ${cartThumbHtml(product)}
      <div class="cart-line-body">
        <div class="cart-line-brand">${brandLabel}</div>
        <div class="cart-line-title">${product.nombre}</div>
        <div class="cart-line-meta">${formatCartLineSpecs(product)}</div>
        <div class="cart-line-actions">
          <div class="cart-qty" role="group" aria-label="Cantidad de ${product.nombre}">
            <button type="button" class="cart-qty-btn" data-cart-action="dec" data-brand="${brand}" data-product-id="${id}" aria-label="Quitar una unidad">−</button>
            <span class="cart-qty-value" aria-live="polite">${qty}</span>
            <button type="button" class="cart-qty-btn" data-cart-action="inc" data-brand="${brand}" data-product-id="${id}" aria-label="Agregar una unidad">+</button>
          </div>
          <button type="button" class="cart-remove-btn" data-cart-action="remove" data-brand="${brand}" data-product-id="${id}">Quitar</button>
        </div>
      </div>
    </li>
  `;
}

function ensureCartShell() {
  if (document.getElementById('cartRoot')) return;

  const root = document.createElement('div');
  root.id = 'cartRoot';
  root.innerHTML = `
    <button type="button" class="cart-fab" id="cartFab" aria-label="Abrir carrito de cotización" hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.7L6.2 4.5A1 1 0 0 0 5.2 3.7H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="10" cy="20" r="1.4" fill="currentColor"/>
        <circle cx="17" cy="20" r="1.4" fill="currentColor"/>
      </svg>
      <span class="cart-fab-badge" id="cartFabBadge">0</span>
    </button>

    <div class="cart-overlay" id="cartOverlay" hidden></div>

    <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle" hidden>
      <div class="cart-drawer-head">
        <div>
          <h2 id="cartDrawerTitle">Tu cotización</h2>
          <p class="cart-drawer-sub">Arma la lista y envíala por WhatsApp.</p>
        </div>
        <button type="button" class="cart-close-btn" id="cartCloseBtn" aria-label="Cerrar carrito">×</button>
      </div>
      <div class="cart-drawer-body">
        <ul class="cart-lines" id="cartLines"></ul>
        <div class="cart-empty" id="cartEmpty" hidden>
          <p>Aún no hay productos. Agrega artículos desde el catálogo de cualquier marca.</p>
        </div>
      </div>
      <div class="cart-drawer-foot" id="cartDrawerFoot">
        <button type="button" class="cart-quote-btn" id="cartQuoteBtn">Pedir cotización por WhatsApp</button>
        <button type="button" class="cart-clear-btn" id="cartClearBtn">Vaciar lista</button>
      </div>
    </aside>
  `;
  document.body.appendChild(root);
}

function renderCartDrawer() {
  const linesEl = document.getElementById('cartLines');
  const emptyEl = document.getElementById('cartEmpty');
  const footEl = document.getElementById('cartDrawerFoot');
  const fab = document.getElementById('cartFab');
  const badge = document.getElementById('cartFabBadge');
  if (!linesEl || !emptyEl || !footEl || !fab || !badge) return;

  const lines = getCartLines();
  const total = getCartTotalUnits();

  badge.textContent = String(total);
  fab.hidden = total === 0;
  fab.classList.toggle('is-empty', total === 0);
  updateCartDestinationCopy();

  if (!lines.length) {
    linesEl.innerHTML = '';
    emptyEl.hidden = false;
    footEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  footEl.hidden = false;
  linesEl.innerHTML = lines.map(cartLineHtml).join('');
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.hidden = false;
  overlay.hidden = false;
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
  });
  document.body.classList.add('cart-open');
  document.getElementById('cartCloseBtn')?.focus();
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.classList.remove('is-open');
  overlay.classList.remove('is-open');
  document.body.classList.remove('cart-open');
  window.setTimeout(() => {
    if (!drawer.classList.contains('is-open')) {
      drawer.hidden = true;
      overlay.hidden = true;
    }
  }, 220);
}

function onCartChanged() {
  renderCartDrawer();
  if (typeof refreshProductCardButtons === 'function') {
    refreshProductCardButtons();
  }
}

function initCart() {
  loadCart();
  refreshSnapshotsForCurrentBrand();
  ensureCartShell();
  onCartChanged();

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn[data-product-id]');
    if (addBtn) {
      if (addBtn.dataset.dragged === 'true') return;
      e.preventDefault();
      addToCart(addBtn.dataset.productId);
      return;
    }

    const actionBtn = e.target.closest('[data-cart-action][data-product-id][data-brand]');
    if (actionBtn) {
      const brand = actionBtn.dataset.brand;
      const id = actionBtn.dataset.productId;
      const action = actionBtn.dataset.cartAction;
      if (action === 'inc') setQty(brand, id, getCartQty(id, brand) + 1);
      else if (action === 'dec') setQty(brand, id, getCartQty(id, brand) - 1);
      else if (action === 'remove') removeFromCart(brand, id);
      return;
    }
  });

  document.getElementById('cartFab')?.addEventListener('click', openCartDrawer);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartQuoteBtn')?.addEventListener('click', submitCartQuote);
  document.getElementById('cartClearBtn')?.addEventListener('click', () => {
    clearCart();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('cart-open')) {
      closeCartDrawer();
    }
  });

  document.addEventListener(CART_EVENT, onCartChanged);
}
