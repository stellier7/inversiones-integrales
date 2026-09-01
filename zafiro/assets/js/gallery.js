const galleryItems = [
  {
    type: 'video',
    src: 'assets/images/gallery/0a4bc464-5446-45d9-94c2-57a1c2081330.mov',
    caption: 'Cerámica en ambiente',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/216a007a-2ada-440e-b9af-c5ea00cd1314.mov',
    caption: 'Showroom Zafiro',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/39e4ae2e-7e03-4b53-a5ef-57a4f98e4516.mov',
    caption: 'Detalle de acabado',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/6c4d158b-ce4d-4de7-b65b-46ec22513c29.mov',
    caption: 'Piso y muro coordinados',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/7eb80164-1d97-4c8c-8b4a-da20c3f855e9.mov',
    caption: 'Instalación en cocina',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/8600aa00-15fb-4bb1-b3e0-e9f89527680a.mov',
    caption: 'Texturas decorativas',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/909fbb6f-4ee6-42b5-b83e-71c0167994b8.mov',
    caption: 'Ambiente residencial',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/db7aa1e5-a631-47b0-96ed-6b28bc84eaaa.mov',
    caption: 'Porcelanato en acción',
  },
  {
    type: 'video',
    src: 'assets/images/gallery/f13ae0eb-95ed-4f80-b8b2-c51129cf80ba.mov',
    caption: 'Línea Zafiro',
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
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch(() => {});
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
