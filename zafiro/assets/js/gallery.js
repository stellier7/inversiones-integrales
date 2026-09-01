const GALLERY_ITEMS = [];

function initGallery() {
  const track = document.getElementById('galleryTrack');
  const openBtn = document.getElementById('galleryOpenBtn');
  if (track) {
    track.innerHTML = '<p class="gallery-empty">Galería en preparación.</p>';
  }
  if (openBtn) openBtn.style.display = 'none';
}
