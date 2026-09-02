const SHARE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8.5 6.5 12 3l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`;

function shareSellerRawFromUrl() {
  if (typeof getSellerRawFromUrl === 'function') {
    return getSellerRawFromUrl();
  }
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('vendedor') || '';
  if (fromQuery) return fromQuery;
  const portalMatch = window.location.pathname.match(/^\/v\/([^/]+)\/?$/);
  if (portalMatch) return decodeURIComponent(portalMatch[1]);
  const brandMatch = window.location.pathname.match(
    /^\/(?:megawatt|buffalo|zafiro|celima|trebol|lumiart)\/v\/([^/]+)\/?$/
  );
  return brandMatch ? decodeURIComponent(brandMatch[1]) : '';
}

function shareSellerSlug() {
  const raw = shareSellerRawFromUrl();
  if (!raw) return '';
  if (typeof getSellerFromUrl === 'function') return getSellerFromUrl();
  if (typeof resolveSeller === 'function') {
    const resolved = resolveSeller(raw);
    if (resolved) return resolved.slug;
  }
  return raw;
}

function normalizeSharePathname(pathname) {
  const portalSeller = pathname.match(/^\/v\/[^/]+\/?$/);
  if (portalSeller) return '/';

  const brandSeller = pathname.match(
    /^\/(megawatt|buffalo|zafiro|celima|trebol|lumiart)\/v\/[^/]+\/?$/
  );
  if (brandSeller) return `/${brandSeller[1]}/`;

  return pathname;
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.pathname = normalizeSharePathname(url.pathname);
  url.hash = '';

  const sellerSlug = shareSellerSlug();
  if (sellerSlug) {
    url.searchParams.set('vendedor', sellerSlug);
  } else {
    url.searchParams.delete('vendedor');
  }

  return url.toString();
}

function closeShareMenu() {
  const menu = document.getElementById('brandShareMenu');
  const btn = document.getElementById('brandShareBtn');
  if (!menu || !btn) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
}

function openShareMenu() {
  const menu = document.getElementById('brandShareMenu');
  const btn = document.getElementById('brandShareBtn');
  if (!menu || !btn) return;
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}

function toggleShareMenu() {
  const menu = document.getElementById('brandShareMenu');
  if (!menu) return;
  if (menu.hidden) openShareMenu();
  else closeShareMenu();
}

function showShareFeedback(message) {
  let toast = document.getElementById('brandShareFeedback');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'brandShareFeedback';
    toast.className = 'brand-share-feedback';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showShareFeedback._timer);
  showShareFeedback._timer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

async function copyShareUrl(url) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    /* fallback below */
  }

  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

function ensureShareButton() {
  let wrap = document.getElementById('brandShareWrap');
  if (wrap) return wrap;

  wrap = document.createElement('div');
  wrap.id = 'brandShareWrap';
  wrap.className = 'brand-share-wrap';

  wrap.innerHTML = `
    <button type="button" id="brandShareBtn" class="brand-share" aria-haspopup="menu" aria-expanded="false" aria-label="Compartir enlace">
      ${SHARE_ICON}
      <span>Compartir</span>
    </button>
    <div id="brandShareMenu" class="brand-share-menu" role="menu" hidden>
      <button type="button" class="brand-share-option" data-share-action="whatsapp" role="menuitem">WhatsApp</button>
      <button type="button" class="brand-share-option" data-share-action="copy" role="menuitem">Copiar enlace</button>
    </div>
  `;

  document.body.appendChild(wrap);
  return wrap;
}

function bindShareEvents() {
  if (bindShareEvents._bound) return;
  bindShareEvents._bound = true;

  document.addEventListener('click', (event) => {
    const wrap = document.getElementById('brandShareWrap');
    if (!wrap) return;

    const btn = event.target.closest('#brandShareBtn');
    if (btn) {
      event.preventDefault();
      toggleShareMenu();
      return;
    }

    const action = event.target.closest('[data-share-action]');
    if (action && wrap.contains(action)) {
      event.preventDefault();
      const url = getShareUrl();
      if (action.dataset.shareAction === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
        closeShareMenu();
        return;
      }
      if (action.dataset.shareAction === 'copy') {
        copyShareUrl(url).then((ok) => {
          showShareFeedback(ok ? 'Enlace copiado' : 'No se pudo copiar el enlace');
        });
        closeShareMenu();
      }
      return;
    }

    if (!wrap.contains(event.target)) {
      closeShareMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeShareMenu();
  });
}

function initShareLink() {
  ensureShareButton();
  bindShareEvents();
  updateShareLink();
}

function updateShareLink() {
  if (!document.getElementById('brandShareWrap')) return;
  closeShareMenu();
}
