function getSellerSlugFromPath() {
  const match = window.location.pathname.match(/^\/trebol\/v\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getSellerRawFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('vendedor') || getSellerSlugFromPath() || '';
}

/** Slug canónico si está en el registro; si no, el valor crudo de la URL. */
function getSellerFromUrl() {
  const raw = getSellerRawFromUrl();
  const resolved = resolveSeller(raw);
  if (resolved) return resolved.slug;
  return raw;
}

function getResolvedSeller() {
  return resolveSeller(getSellerRawFromUrl());
}

const SELLER_STORAGE_KEY = 'trebol-seller';

function rememberSeller(slug) {
  if (!slug) return;
  try {
    localStorage.setItem(SELLER_STORAGE_KEY, slug);
  } catch {
    /* ignore quota / private mode */
  }
}

function getRememberedSeller() {
  try {
    return resolveSeller(localStorage.getItem(SELLER_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Vendedor activo para WhatsApp / links: el de la URL, o el recordado
 * de una visita NFC anterior (para que la cotización le caiga al vendedor).
 */
function getActiveSeller() {
  return getResolvedSeller() || getRememberedSeller();
}

function sellerQuery(slug) {
  return slug ? '?vendedor=' + encodeURIComponent(slug) : '';
}

function setSeller(slug) {
  const backLink = document.getElementById('backLink');
  const catalogCard = document.getElementById('catalogCard');

  if (backLink) {
    backLink.href = 'index.html' + sellerQuery(slug);
  }

  if (catalogCard) {
    catalogCard.href = 'productos.html' + sellerQuery(slug);
  }

  const featuredCatalogLink = document.getElementById('featuredCatalogLink');
  if (featuredCatalogLink) {
    featuredCatalogLink.href = 'productos.html' + sellerQuery(slug);
  }

  const footerHome = document.getElementById('footerHome');
  if (footerHome) {
    footerHome.href = 'index.html' + sellerQuery(slug);
  }
}

function initSeller() {
  const fromUrl = getResolvedSeller();
  if (fromUrl) rememberSeller(fromUrl.slug);

  const active = getActiveSeller();
  setSeller(active?.slug || getSellerFromUrl());
}
