const galleryItems = [
  {
    type: 'image',
    src: 'assets/images/gallery/esponja-stacks.jpeg',
    caption: 'Esponja Multi-Uso 3W Plus',
    objectPosition: 'center center',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/tornillo-14x2-box.jpeg',
    caption: 'Tornillo techo #14×2" · 250 pzs',
    objectPosition: 'center center',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/tornillo-open-box.jpeg',
    caption: 'Tornillo punta broca · punta hexagonal',
    objectPosition: 'center center',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/esponja-unit.jpeg',
    caption: 'Esponja 3W Plus · pulido',
    objectPosition: 'center center',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/tornillo-14x3-box.jpeg',
    caption: 'Tornillo techo #14×3" · 200 pzs',
    objectPosition: 'center center',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/tornillo-two-boxes.jpeg',
    caption: 'Línea de tornillos Buffalo',
    objectPosition: 'center center',
  },
];

function isGalleryVideo(path) {
  return /\.(mp4|webm|mov)$/i.test(path || '');
}

function galleryMediaHtml(item, { preview = true } = {}) {
  if (isGalleryVideo(item.src)) {
    const controls = preview ? '' : 'controls ';
    return `<video src="${item.src}" ${controls}muted playsinline loop autoplay preload="metadata" aria-label="${item.caption}"></video>`;
  }
  const positionStyle = item.objectPosition ? ` style="object-position: ${item.objectPosition}"` : '';
  return `<img src="${item.src}" alt="${item.caption}" loading="lazy"${positionStyle}>`;
}

function gallerySlideHtml(item, index) {
  return `
    <button type="button" class="gallery-slide" data-gallery-index="${index}" aria-label="Abrir: ${item.caption}">
      <span class="gallery-media">${galleryMediaHtml(item)}</span>
      ${item.caption ? `<span class="gallery-caption">${item.caption}</span>` : ''}
      <span class="gallery-zoom-hint" aria-hidden="true">Ampliar</span>
    </button>
  `;
}

function renderGalleryCarousel() {
  const track = document.getElementById('galleryTrack');
  if (!track || !galleryItems.length) return;
  const slides = galleryItems.map(gallerySlideHtml).join('');
  track.innerHTML = slides + slides;
}

function initGalleryDragCarousel() {
  const carousel = document.getElementById('galleryCarousel');
  const track = document.getElementById('galleryTrack');
  if (!carousel || !track || galleryItems.length < 2) return;

  initAutoCarousel(track, carousel, {
    speed: 0.42,
    direction: 1,
    staticClass: 'gallery-carousel--static',
    dragGuardSelector: '.gallery-slide',
  });
}

function ensureGalleryLightbox() {
  let lightbox = document.getElementById('galleryLightbox');
  if (lightbox) return lightbox;

  lightbox = document.createElement('div');
  lightbox.id = 'galleryLightbox';
  lightbox.className = 'gallery-lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="gallery-lightbox-backdrop" data-gallery-close></div>
    <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Galería ampliada">
      <button type="button" class="gallery-lightbox-close" data-gallery-close aria-label="Cerrar galería">×</button>
      <button type="button" class="gallery-lightbox-nav gallery-lightbox-prev" data-gallery-prev aria-label="Anterior">‹</button>
      <button type="button" class="gallery-lightbox-nav gallery-lightbox-next" data-gallery-next aria-label="Siguiente">›</button>
      <div class="gallery-lightbox-stage" id="galleryLightboxStage"></div>
      <p class="gallery-lightbox-caption" id="galleryLightboxCaption"></p>
      <p class="gallery-lightbox-swipe-hint" aria-hidden="true">Desliza para ver más</p>
    </div>
  `;
  document.body.appendChild(lightbox);
  return lightbox;
}

function initGalleryLightbox() {
  const lightbox = ensureGalleryLightbox();
  const stage = document.getElementById('galleryLightboxStage');
  const captionEl = document.getElementById('galleryLightboxCaption');
  let activeIndex = 0;
  let lastFocus = null;
  let swipeStartX = 0;
  let swipeStartY = 0;

  const renderSlide = (index, direction = 0) => {
    const item = galleryItems[index];
    if (!item || !stage) return;

    activeIndex = index;
    stage.classList.remove('slide-from-left', 'slide-from-right');
    if (direction < 0) stage.classList.add('slide-from-left');
    if (direction > 0) stage.classList.add('slide-from-right');

    stage.innerHTML = `<div class="gallery-lightbox-media">${galleryMediaHtml(item, { preview: false })}</div>`;
    if (captionEl) captionEl.textContent = item.caption || '';

    const video = stage.querySelector('video');
    if (video) {
      if (typeof configureLoopingVideo === 'function') configureLoopingVideo(video);
      else {
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.play().catch(() => {});
      }
    }

    window.requestAnimationFrame(() => {
      stage.classList.remove('slide-from-left', 'slide-from-right');
    });
  };

  const open = (index) => {
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    lightbox.classList.add('open');
    document.body.classList.add('gallery-lightbox-open');
    renderSlide(index);
    lightbox.querySelector('.gallery-lightbox-close')?.focus();
  };

  const close = () => {
    stage?.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    lightbox.classList.remove('open');
    lightbox.hidden = true;
    document.body.classList.remove('gallery-lightbox-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const showNext = (step) => {
    const next = (activeIndex + step + galleryItems.length) % galleryItems.length;
    renderSlide(next, step);
  };

  document.getElementById('galleryTrack')?.addEventListener('click', (e) => {
    const slide = e.target.closest('.gallery-slide');
    if (!slide || slide.dataset.dragged === 'true') return;
    open(Number(slide.dataset.galleryIndex));
  });

  document.getElementById('galleryOpenBtn')?.addEventListener('click', () => open(0));

  lightbox.querySelectorAll('[data-gallery-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  lightbox.querySelector('[data-gallery-prev]')?.addEventListener('click', () => showNext(-1));
  lightbox.querySelector('[data-gallery-next]')?.addEventListener('click', () => showNext(1));

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

  stage?.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    onSwipeStart(e.clientX, e.clientY);
  });

  stage?.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') return;
    onSwipeEnd(e.clientX, e.clientY);
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showNext(-1);
    if (e.key === 'ArrowRight') showNext(1);
  });
}

function initGallery() {
  const openBtn = document.getElementById('galleryOpenBtn');
  if (!galleryItems.length) {
    const track = document.getElementById('galleryTrack');
    if (track) track.innerHTML = '<p class="gallery-empty">Galería en preparación.</p>';
    if (openBtn) openBtn.style.display = 'none';
    return;
  }
  if (openBtn) openBtn.style.display = '';
  renderGalleryCarousel();
  initGalleryDragCarousel();
  initGalleryLightbox();
}
