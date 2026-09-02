function initAutoCarousel(track, carousel, options = {}) {
  if (!track || !carousel) return;

  const speed = options.speed ?? 0.55;
  const direction = options.direction ?? 1;
  const staticClass = options.staticClass ?? 'auto-carousel--static';
  const dragGuardSelector = options.dragGuardSelector ?? '.add-to-cart-btn';
  const dragThreshold = 6;
  const dragResumeDelay = 600;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    carousel.classList.add(staticClass);
    return;
  }

  let offset = 0;
  let paused = false;
  let inView = true;
  let loopWidth = 0;
  let rafId = 0;
  let resumeTimer = 0;
  let momentumId = 0;

  let isDragging = false;
  let gestureMode = null;
  let startX = 0;
  let startY = 0;
  let startOffset = 0;
  let moved = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let activePointerId = null;

  const applyTransform = () => {
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
  };

  const readCurrentOffset = () => {
    const transform = window.getComputedStyle(track).transform;
    if (!transform || transform === 'none') return offset;
    return -new DOMMatrix(transform).m41;
  };

  const normalizeOffset = () => {
    if (loopWidth <= 0) return;
    while (offset >= loopWidth) offset -= loopWidth;
    while (offset < 0) offset += loopWidth;
    applyTransform();
  };

  const getUnitCount = () => {
    const total = track.children.length;
    if (total < 2) return 0;
    if (track.dataset.loopClones === 'expanded') {
      if (total % 3 !== 0) return 0;
      return total / 3;
    }
    if (total % 2 !== 0) return 0;
    return total / 2;
  };

  const ensureLoopClones = () => {
    if (track.dataset.loopClones === 'expanded') return false;

    const unitCount = getUnitCount();
    if (unitCount < 1) return false;

    const seam = track.children[unitCount].offsetLeft;
    if (seam <= 0) return false;
    if (track.scrollWidth >= seam * 2.5) return false;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < unitCount; i++) {
      fragment.appendChild(track.children[i].cloneNode(true));
    }
    track.appendChild(fragment);
    track.dataset.loopClones = 'expanded';
    return true;
  };

  const measure = () => {
    if (ensureLoopClones()) {
      track.querySelectorAll('img, video').forEach((el) => {
        el.addEventListener('load', measure, { once: true });
        el.addEventListener('loadeddata', measure, { once: true });
        el.addEventListener('error', measure, { once: true });
      });
    }

    const unitCount = getUnitCount();
    if (unitCount < 1) {
      loopWidth = 0;
      return;
    }

    loopWidth = track.children[unitCount].offsetLeft;
    if (loopWidth > 0) normalizeOffset();
  };

  const pause = () => {
    paused = true;
  };

  const resume = () => {
    paused = false;
  };

  const scheduleResume = () => {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(resume, dragResumeDelay);
  };

  const stopMomentum = () => {
    if (momentumId) {
      cancelAnimationFrame(momentumId);
      momentumId = 0;
    }
  };

  const startMomentum = () => {
    stopMomentum();
    if (Math.abs(velocity) < 0.15) {
      scheduleResume();
      return;
    }

    let lastFrame = performance.now();
    const step = (now) => {
      if (loopWidth <= 0) {
        momentumId = 0;
        scheduleResume();
        return;
      }

      const dt = now - lastFrame;
      lastFrame = now;
      offset -= velocity * dt;
      velocity *= 0.92;
      normalizeOffset();

      if (Math.abs(velocity) > 0.05) {
        momentumId = requestAnimationFrame(step);
      } else {
        momentumId = 0;
        scheduleResume();
      }
    };
    momentumId = requestAnimationFrame(step);
  };

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', () => {
      if (!isDragging && !momentumId) resume();
    });
  }

  const resetGesture = () => {
    isDragging = false;
    gestureMode = null;
    activePointerId = null;
    carousel.classList.remove('is-dragging');
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopMomentum();
    window.clearTimeout(resumeTimer);
    pause();

    gestureMode = null;
    isDragging = false;
    activePointerId = e.pointerId;
    moved = 0;
    velocity = 0;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastTime = performance.now();
    startOffset = readCurrentOffset();
    offset = startOffset;
  };

  const onPointerMove = (e) => {
    if (activePointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (gestureMode === null) {
      if (absDx < dragThreshold && absDy < dragThreshold) return;
      gestureMode = absDx > absDy * 1.1 ? 'horizontal' : 'vertical';
      if (gestureMode === 'horizontal') {
        isDragging = true;
        carousel.classList.add('is-dragging');
        carousel.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }

    if (gestureMode === 'vertical' || !isDragging) return;

    e.preventDefault();
    if (loopWidth <= 0) return;

    const now = performance.now();
    if (now - lastTime > 0) {
      velocity = (e.clientX - lastX) / (now - lastTime);
    }
    lastX = e.clientX;
    lastTime = now;

    moved = Math.max(moved, absDx);
    offset = startOffset - dx;
    normalizeOffset();
  };

  const onPointerUp = (e) => {
    if (activePointerId !== e.pointerId) return;

    if (isDragging) {
      if (carousel.hasPointerCapture?.(e.pointerId)) {
        carousel.releasePointerCapture(e.pointerId);
      }
      normalizeOffset();

      carousel.querySelectorAll(dragGuardSelector).forEach((el) => {
        el.dataset.dragged = moved > 10 ? 'true' : 'false';
        if (moved > 10) {
          window.setTimeout(() => {
            el.dataset.dragged = 'false';
          }, 0);
        }
      });

      if (moved > 10) {
        startMomentum();
      } else {
        resume();
      }
    } else if (gestureMode === 'vertical' || gestureMode === null) {
      resume();
    }

    resetGesture();
  };

  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointermove', onPointerMove, { passive: false });
  carousel.addEventListener('pointerup', onPointerUp);
  carousel.addEventListener('pointercancel', onPointerUp);

  const tick = () => {
    if (!paused && !momentumId && inView && loopWidth > 0) {
      offset += speed * direction;
      normalizeOffset();
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    measure();
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(measure);
    ro.observe(track);
  }

  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener(
    'orientationchange',
    () => {
      window.setTimeout(measure, 250);
    },
    { passive: true }
  );

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView) measure();
      },
      { threshold: 0.08 }
    );
    io.observe(carousel);
  }

  start();

  track.querySelectorAll('img, video').forEach((el) => {
    el.addEventListener('load', measure, { once: true });
    el.addEventListener('loadeddata', measure, { once: true });
    el.addEventListener('error', measure, { once: true });
  });

  window.setTimeout(measure, 400);
  window.setTimeout(measure, 1500);
}
