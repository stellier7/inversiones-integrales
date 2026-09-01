const galleryItems = [
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-04.jpeg',
    caption: 'Ambiente iluminado',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-12.jpeg',
    caption: 'Sala contemporánea',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-16.jpeg',
    caption: 'Comedor elegante',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-19.jpeg',
    caption: 'Detalle de iluminación',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-05.jpeg',
    caption: 'Dormitorio moderno',
  },
  {
    type: 'image',
    src: 'assets/images/gallery/gallery-01.jpeg',
    caption: 'Lámparas Smart',
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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const itemCount = galleryItems.length;

  let offset = 0;
  let isDragging = false;
  let startX = 0;
  let startOffset = 0;
  let moved = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let snapTimer = 0;
  let snapTransitionHandler = null;

  const applyTransform = () => {
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
  };

  const readCurrentOffset = () => {
    const transform = window.getComputedStyle(track).transform;
    if (!transform || transform === 'none') return offset;
    return -new DOMMatrix(transform).m41;
  };

  const getMetrics = () => {
    const slides = Array.from(track.querySelectorAll('.gallery-slide'));
    const center = carousel.clientWidth / 2;
    const positions = slides.map((slide) => slide.offsetLeft + slide.offsetWidth / 2 - center);
    const pitch = positions.length > 1 ? positions[1] - positions[0] : slides[0]?.offsetWidth + 20 || 360;
    return { positions, pitch };
  };

  const pickTarget = (currentOffset, releaseVelocity = 0) => {
    const { positions, pitch } = getMetrics();
    if (!positions.length) return { targetOffset: 0, targetIdx: 0 };

    let nearestIdx = 0;
    let nearestDist = Infinity;
    positions.forEach((candidate, i) => {
      const dist = Math.abs(candidate - currentOffset);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });

    const dragDelta = currentOffset - positions[nearestIdx];
    const flickThreshold = pitch * 0.14;
    let targetIdx = nearestIdx;

    if (dragDelta > flickThreshold || releaseVelocity < -0.12) {
      targetIdx = nearestIdx + 1;
    } else if (dragDelta < -flickThreshold || releaseVelocity > 0.12) {
      targetIdx = nearestIdx - 1;
    }

    if (targetIdx < 0) targetIdx = itemCount - 1;
    else if (targetIdx >= positions.length) targetIdx = itemCount;

    const mod = ((targetIdx % itemCount) + itemCount) % itemCount;
    let finalIdx = mod;
    let finalOffset = positions[mod];

    [mod, mod + itemCount].forEach((i) => {
      if (i < positions.length) {
        const candidate = positions[i];
        if (Math.abs(candidate - currentOffset) < Math.abs(finalOffset - currentOffset)) {
          finalOffset = candidate;
          finalIdx = i;
        }
      }
    });

    if (targetIdx !== mod && targetIdx !== mod + itemCount && targetIdx < positions.length) {
      finalIdx = targetIdx;
      finalOffset = positions[targetIdx];
    }

    return { targetOffset: finalOffset, targetIdx: finalIdx };
  };

  const normalizeLoop = (targetIdx) => {
    if (targetIdx == null || targetIdx < itemCount) return;
    const { positions } = getMetrics();
    const normalizedIdx = targetIdx - itemCount;
    if (normalizedIdx >= 0 && normalizedIdx < positions.length) {
      offset = positions[normalizedIdx];
      applyTransform();
    }
  };

  const clearSnap = () => {
    if (snapTimer) {
      clearTimeout(snapTimer);
      snapTimer = 0;
    }
    if (snapTransitionHandler) {
      track.removeEventListener('transitionend', snapTransitionHandler);
      snapTransitionHandler = null;
    }
    if (track.classList.contains('is-snapping')) {
      offset = readCurrentOffset();
      applyTransform();
    }
    track.classList.remove('is-snapping');
  };

  const finishSnap = (targetOffset, targetIdx) => {
    clearSnap();
    offset = targetOffset;
    applyTransform();
    normalizeLoop(targetIdx);
  };

  const snapTo = (releaseVelocity = 0) => {
    if (isDragging) return;

    const { targetOffset, targetIdx } = pickTarget(offset, releaseVelocity);

    if (Math.abs(targetOffset - offset) < 0.5 || reducedMotion) {
      finishSnap(targetOffset, targetIdx);
      return;
    }

    clearSnap();
    track.classList.add('is-snapping');

    snapTransitionHandler = (e) => {
      if (e.target !== track || e.propertyName !== 'transform') return;
      finishSnap(targetOffset, targetIdx);
    };
    track.addEventListener('transitionend', snapTransitionHandler);
    snapTimer = window.setTimeout(() => finishSnap(targetOffset, targetIdx), 280);

    requestAnimationFrame(() => {
      offset = targetOffset;
      applyTransform();
    });
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearSnap();
    isDragging = true;
    moved = 0;
    startX = e.clientX;
    lastX = e.clientX;
    lastTime = performance.now();
    startOffset = readCurrentOffset();
    offset = startOffset;
    velocity = 0;
    carousel.classList.add('is-dragging');
    carousel.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const delta = e.clientX - startX;
    moved = Math.max(moved, Math.abs(delta));

    if (now - lastTime > 0) {
      velocity = (e.clientX - lastX) / (now - lastTime);
    }
    lastX = e.clientX;
    lastTime = now;

    offset = startOffset - delta;
    applyTransform();
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    if (carousel.hasPointerCapture?.(e.pointerId)) {
      carousel.releasePointerCapture(e.pointerId);
    }

    carousel.querySelectorAll('.gallery-slide').forEach((slide) => {
      slide.dataset.dragged = moved > 10 ? 'true' : 'false';
      if (moved > 10) {
        window.setTimeout(() => {
          slide.dataset.dragged = 'false';
        }, 0);
      }
    });

    if (moved <= 10) return;
    snapTo(velocity);
  };

  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointermove', onPointerMove);
  carousel.addEventListener('pointerup', onPointerUp);
  carousel.addEventListener('pointercancel', onPointerUp);

  carousel.addEventListener(
    'wheel',
    (e) => {
      const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!delta || isDragging) return;

      e.preventDefault();
      clearSnap();
      offset = readCurrentOffset();

      const direction = delta > 0 ? 1 : -1;
      const { pitch } = getMetrics();
      const { targetOffset, targetIdx } = pickTarget(offset + direction * pitch * 0.35, direction * 0.2);

      if (Math.abs(targetOffset - offset) < 0.5 || reducedMotion) {
        finishSnap(targetOffset, targetIdx);
        return;
      }

      track.classList.add('is-snapping');
      snapTransitionHandler = (ev) => {
        if (ev.target !== track || ev.propertyName !== 'transform') return;
        finishSnap(targetOffset, targetIdx);
      };
      track.addEventListener('transitionend', snapTransitionHandler);
      snapTimer = window.setTimeout(() => finishSnap(targetOffset, targetIdx), 280);

      requestAnimationFrame(() => {
        offset = targetOffset;
        applyTransform();
      });
    },
    { passive: false }
  );

  const onLayout = () => {
    if (isDragging) return;
    const { targetOffset, targetIdx } = pickTarget(readCurrentOffset(), 0);
    finishSnap(targetOffset, targetIdx);
  };

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(onLayout);
    ro.observe(track);
    ro.observe(carousel);
  } else {
    window.addEventListener('resize', onLayout, { passive: true });
  }

  window.addEventListener(
    'orientationchange',
    () => window.setTimeout(onLayout, 250),
    { passive: true }
  );

  requestAnimationFrame(() => snapTo(0));
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
  renderGalleryCarousel();
  initGalleryDragCarousel();
  initGalleryLightbox();
}
