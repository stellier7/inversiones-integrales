const PORTAL_BRANDS = [
  { id: 'megawatt', label: 'Megawatt', href: '/megawatt/' },
  { id: 'lumiart', label: 'Lumiart', href: '/lumiart/' },
  { id: 'buffalo', label: 'Búfalo', href: '/buffalo/' },
  { id: 'zafiro', label: 'Zafiro', href: '/zafiro/' },
  { id: 'celima', label: 'Celima', href: '/celima/' },
  { id: 'trebol', label: 'Trébol', href: '/trebol/' },
];

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

function removeLegacyPortalButton() {
  document.getElementById('portalBackBtn')?.remove();
}

function ensureBackLink() {
  removeLegacyPortalButton();

  let link = document.getElementById('backLink');
  const isCatalog = document.body.classList.contains('page-catalog');

  if (!link) {
    link = document.createElement('a');
    link.id = 'backLink';
    link.className = isCatalog ? 'back-link' : 'brand-volver';
    link.textContent = '← Volver';
    link.setAttribute('aria-label', 'Volver al portal de marcas');

    if (isCatalog) {
      const pageHead = document.querySelector('.page-head');
      if (pageHead) pageHead.insertBefore(link, pageHead.firstChild);
      else document.body.prepend(link);
    } else {
      document.body.prepend(link);
    }
  } else {
    link.textContent = '← Volver';
    link.setAttribute('aria-label', 'Volver al portal de marcas');
  }

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
  const back = ensureBackLink();
  back.href = portalHref(sellerSlug);
  renderBrandFooterLinks(sellerSlug);
}

function initBrandNav() {
  if (!detectCurrentBrand()) return;
  const slug = typeof getSellerFromUrl === 'function' ? getSellerFromUrl() : '';
  updateBrandNavForSeller(slug);
}
