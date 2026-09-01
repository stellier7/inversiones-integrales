function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHeroParallax() {
  const heroMark = document.getElementById('heroMark');
  if (!heroMark) return;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      heroMark.style.transform = `translateY(${y * 0.18}px) scale(${Math.max(1 - y * 0.0006, 0.85)})`;
    },
    { passive: true }
  );
}

function initBoltField() {
  const boltField = document.getElementById('boltField');
  if (!boltField) return;
  for (let i = 0; i < 7; i++) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', String(40 + Math.random() * 90));
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
    s.innerHTML = '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#E8611F"/>';
    boltField.appendChild(s);
  }
}

function initCardTilt() {
  document.querySelectorAll('.action-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateY(0) rotateX(0) translateY(0)';
    });
  });
}

function initReveal() {
  const reveal = (el) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('in'));
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) reveal(en.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

function initAutoCarousel(track, carousel, options = {}) {
  if (!track || !carousel) return;

  const speed = options.speed ?? 0.55;
  const staticClass = options.staticClass ?? 'auto-carousel--static';
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

  const measure = () => {
    loopWidth = track.scrollWidth / 2;
    if (loopWidth > 0) offset %= loopWidth;
  };

  const normalizeOffset = () => {
    if (loopWidth <= 0) return;
    while (offset >= loopWidth) offset -= loopWidth;
    while (offset < 0) offset += loopWidth;
    applyTransform();
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
    const now = performance.now();
    if (now - lastTime > 0) {
      velocity = (e.clientX - lastX) / (now - lastTime);
    }
    lastX = e.clientX;
    lastTime = now;

    moved = Math.max(moved, absDx);
    offset = startOffset - dx;
    applyTransform();
  };

  const onPointerUp = (e) => {
    if (activePointerId !== e.pointerId) return;

    if (isDragging) {
      if (carousel.hasPointerCapture?.(e.pointerId)) {
        carousel.releasePointerCapture(e.pointerId);
      }
      normalizeOffset();

      carousel.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
        btn.dataset.dragged = moved > 10 ? 'true' : 'false';
        if (moved > 10) {
          window.setTimeout(() => {
            btn.dataset.dragged = 'false';
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
      offset += speed;
      if (offset >= loopWidth) offset -= loopWidth;
      applyTransform();
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

function initFeaturedCarousel() {
  initAutoCarousel(
    document.getElementById('featuredTrack'),
    document.getElementById('featuredCarousel'),
    { speed: 0.55, staticClass: 'featured-carousel--static' }
  );
}

function initLanding() {
  initHeroParallax();
  initBoltField();
  initCardTilt();
  initReveal();
  initFeaturedCarousel();
}
