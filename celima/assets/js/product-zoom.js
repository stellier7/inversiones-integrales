function catalogZoomProducts() {
  const items = catalogState.group ? groupProducts(catalogState.group) : products;
  return items.filter((p) => p.image && !isVideoPath(p.image));
}

function ensureProductLightbox() {
  let lightbox = document.getElementById('productLightbox');
  if (lightbox) return lightbox;

  lightbox = document.createElement('div');
  lightbox.id = 'productLightbox';
  lightbox.className = 'gallery-lightbox product-lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="gallery-lightbox-backdrop" data-product-close></div>
    <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Producto ampliado">
      <button type="button" class="gallery-lightbox-close" data-product-close aria-label="Cerrar">×</button>
      <button type="button" class="gallery-lightbox-nav gallery-lightbox-prev" data-product-prev aria-label="Anterior">‹</button>
      <button type="button" class="gallery-lightbox-nav gallery-lightbox-next" data-product-next aria-label="Siguiente">›</button>
      <div class="gallery-lightbox-stage" id="productLightboxStage"></div>
      <p class="gallery-lightbox-caption" id="productLightboxCaption"></p>
    </div>
  `;
  document.body.appendChild(lightbox);
  return lightbox;
}

function initProductZoom() {
  const root = document.getElementById('catalogTree');
  if (!root) return;

  const lightbox = ensureProductLightbox();
  const stage = document.getElementById('productLightboxStage');
  const captionEl = document.getElementById('productLightboxCaption');
  let activeIndex = 0;
  let lastFocus = null;
  let swipeStartX = 0;
  let swipeStartY = 0;

  const renderSlide = (index, direction = 0) => {
    const zoomProducts = catalogZoomProducts();
    const product = zoomProducts[index];
    if (!product || !stage) return;

    activeIndex = index;
    stage.classList.remove('slide-from-left', 'slide-from-right');
    if (direction < 0) stage.classList.add('slide-from-left');
    if (direction > 0) stage.classList.add('slide-from-right');

    stage.innerHTML = `<div class="gallery-lightbox-media"><img src="${product.image}" alt="${product.nombre}"></div>`;
    if (captionEl) {
      const chips = [product.nombre, product.chip1, product.chip2, product.chip3].filter(Boolean).join(' · ');
      captionEl.textContent = chips;
    }

    window.requestAnimationFrame(() => {
      stage.classList.remove('slide-from-left', 'slide-from-right');
    });
  };

  const open = (productId) => {
    const zoomProducts = catalogZoomProducts();
    const index = zoomProducts.findIndex((p) => p.id === productId);
    if (index < 0) return;

    lastFocus = document.activeElement;
    lightbox.hidden = false;
    lightbox.classList.add('open');
    document.body.classList.add('gallery-lightbox-open');
    renderSlide(index);
    lightbox.querySelector('.gallery-lightbox-close')?.focus();
  };

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.hidden = true;
    document.body.classList.remove('gallery-lightbox-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const showNext = (step) => {
    const zoomProducts = catalogZoomProducts();
    if (!zoomProducts.length) return;
    const next = (activeIndex + step + zoomProducts.length) % zoomProducts.length;
    renderSlide(next, step);
  };

  root.addEventListener('click', (e) => {
    const zoomBtn = e.target.closest('.product-photo-zoom');
    if (zoomBtn) {
      e.preventDefault();
      e.stopPropagation();
      open(zoomBtn.dataset.productId);
      return;
    }

    const photo = e.target.closest('.grid-product-card .p-photo--zoomable');
    if (!photo || e.target.closest('.product-photo-zoom, .add-to-cart-btn')) return;
    if (!photo.querySelector('img')) return;

    const card = photo.closest('[data-product-id]');
    if (card) open(card.dataset.productId);
  });

  lightbox.querySelectorAll('[data-product-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  lightbox.querySelector('[data-product-prev]')?.addEventListener('click', () => showNext(-1));
  lightbox.querySelector('[data-product-next]')?.addEventListener('click', () => showNext(1));

  const onSwipeStart = (x, y) => {
    swipeStartX = x;
    swipeStartY = y;
  };

  const onSwipeEnd = (x, y) => {
    const dx = x - swipeStartX;
    const dy = y - swipeStartY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    showNext(dx < 0 ? 1 : -1);
  };

  stage?.addEventListener(
    'touchstart',
    (e) => {
      onSwipeStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    },
    { passive: true }
  );

  stage?.addEventListener(
    'touchend',
    (e) => {
      onSwipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    },
    { passive: true }
  );

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showNext(-1);
    if (e.key === 'ArrowRight') showNext(1);
  });
}
