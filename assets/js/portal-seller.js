const SELLER_STORAGE_KEY = 'ii-seller';

function getSellerSlugFromPath() {
  const match = window.location.pathname.match(/^\/v\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getSellerRawFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('vendedor') || getSellerSlugFromPath() || '';
}

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

function getResolvedSeller() {
  return resolveSeller(getSellerRawFromUrl());
}

function getActiveSellerSlug() {
  const fromUrl = getResolvedSeller();
  if (fromUrl) return fromUrl.slug;
  const remembered = getRememberedSeller();
  return remembered?.slug || '';
}

function withSellerQuery(url, slug) {
  if (!slug || !url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'vendedor=' + encodeURIComponent(slug);
}

function initPortalSeller() {
  const fromUrl = getResolvedSeller();
  if (fromUrl) rememberSeller(fromUrl.slug);

  const slug = getActiveSellerSlug();

  document.querySelectorAll('a.brand-card[href]').forEach((card) => {
    const href = card.getAttribute('href');
    if (href) {
      card.href = withSellerQuery(href, slug);
    }
  });
}
