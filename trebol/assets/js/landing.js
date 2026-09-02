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
  const accent = '☘️';
  for (let i = 0; i < 7; i++) {
    const el = document.createElement('span');
    el.className = 'bolt-emoji';
    el.textContent = accent;
    el.setAttribute('aria-hidden', 'true');
    el.style.fontSize = `${40 + Math.random() * 90}px`;
    el.style.left = Math.random() * 100 + '%';
    el.style.top = Math.random() * 100 + '%';
    el.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
    boltField.appendChild(el);
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

function initFeaturedCarousel() {
  initAutoCarousel(
    document.getElementById('featuredTrack'),
    document.getElementById('featuredCarousel'),
    { speed: 0.55, direction: -1, staticClass: 'featured-carousel--static' }
  );
}

function initLanding() {
  initHeroParallax();
  initBoltField();
  initCardTilt();
  initReveal();
  initFeaturedCarousel();
}
