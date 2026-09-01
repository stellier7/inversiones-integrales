// Placeholder catalog — owner will replace with real product data.
const img = (file) => (file ? `assets/images/${file}` : '');

const LINEA = {
  general: 'Línea general',
};

const catalogSections = [
  {
    id: 'general',
    linea: LINEA.general,
    eyebrow: 'Catálogo en preparación',
    title: 'Productos Lumiart',
    intro: 'Estamos preparando el catálogo completo de Lumiart. Mientras tanto, contáctanos por WhatsApp para cotizar.',
    image: '',
    groups: [
      {
        id: 'placeholder',
        kicker: 'Próximamente',
        menuLabel: 'Línea general',
        finderLabel: 'Productos generales',
        title: 'Catálogo en preparación',
        blurb: 'El catálogo de Lumiart estará disponible pronto. Escríbenos por WhatsApp para más información.',
      },
    ],
  },
];

const products = [];

function studioForSpot() { return ''; }

function initCatalog() {
  const tree = document.getElementById('catalogTree');
  if (!tree) return;

  tree.innerHTML = `
    <div class="catalog-placeholder">
      <h3>Catálogo en preparación</h3>
      <p>Estamos armando el catálogo de Lumiart. Contáctanos por WhatsApp para cotizar productos.</p>
    </div>
  `;
}

function initFeatured() {
  const track = document.getElementById('featuredTrack');
  if (!track) return;
  track.innerHTML = `
    <div class="featured-card featured-card--placeholder">
      <div class="featured-card-body">
        <div class="featured-eyebrow">Lumiart</div>
        <h3>Productos próximamente</h3>
        <p>El catálogo de Lumiart estará disponible pronto.</p>
      </div>
    </div>
  `;
}

function refreshProductCardButtons() {}
function isVideoPath() { return false; }
