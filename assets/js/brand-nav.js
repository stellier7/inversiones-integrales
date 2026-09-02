const PORTAL_BRANDS = [
  { id: 'megawatt', label: 'Megawatt', href: '/megawatt/' },
  { id: 'lumiart', label: 'Lumiart', href: '/lumiart/' },
  { id: 'buffalo', label: 'Búfalo', href: '/buffalo/' },
  { id: 'zafiro', label: 'Zafiro', href: '/zafiro/' },
  { id: 'celima', label: 'Celima', href: '/celima/' },
  { id: 'trebol', label: 'Trébol', href: '/trebol/' },
];

const PORTAL_BACK_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="2.2" fill="currentColor"></circle>
    <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke="currentColor" stroke-width="1.5"></ellipse>
    <ellipse cx="12" cy="12" rx="3.6" ry="9" stroke="currentColor" stroke-width="1.5" transform="rotate(58 12 12)"></ellipse>
  </svg>
`;

function detectCurrentBrand() {
  const match = window.location.pathname.match(/^\/(megawatt|buffalo|zafiro|celima|trebol|lumiart)(?:\/|$)/);
  return match ? match[1] : '';
}

function portalHref(sellerSlug) {
  if (!sellerSlug) return '/';
  if (typeof withSellerQuery === 'function') return withSellerQuery('/', sellerSlug);
  return '/?vendedor=' + encodeURIComponent(sellerSlug);
}

function brandHref(brand, sellerSlug) {
  if (!sellerSlug) return brand.href;
  if (typeof withSellerQuery === 'function') return withSellerQuery(brand.href, sellerSlug);
  return brand.href + '?vendedor=' + encodeURIComponent(sellerSlug);
}

function ensurePortalBackButton() {
  if (document.getElementById('portalBackBtn')) return document.getElementById('portalBackBtn');
  const link = document.createElement('a');
  link.id = 'portalBackBtn';
  link.className = 'portal-back';
  link.setAttribute('aria-label', 'Volver al portal de marcas');
  link.innerHTML = PORTAL_BACK_ICON + '<span>Inicio</span>';
  document.body.prepend(link);
  return link;
}

function renderBrandFooterLinks(sellerSlug = '') {
  const container = document.getElementById('brandFooterLinks');
  if (!container) return;

  const current = detectCurrentBrand();
  const links = [`<a href="${portalHref(sellerSlug)}" id="footerPortal">Inicio</a>`];

  PORTAL_BRANDS.filter((brand) => brand.id !== current).forEach((brand) => {
    links.push(`<a href="${brandHref(brand, sellerSlug)}">${brand.label}</a>`);
  });

  container.innerHTML = links.join('');
}

function updateBrandNavForSeller(sellerSlug = '') {
  const back = ensurePortalBackButton();
  back.href = portalHref(sellerSlug);
  renderBrandFooterLinks(sellerSlug);
}

function initBrandNav() {
  if (!detectCurrentBrand()) return;
  ensurePortalBackButton();
  const slug = typeof getSellerFromUrl === 'function' ? getSellerFromUrl() : '';
  updateBrandNavForSeller(slug);
}
