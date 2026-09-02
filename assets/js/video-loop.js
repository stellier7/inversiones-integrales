function configureLoopingVideo(video) {
  if (!video || video.dataset.loopReady === '1') return;
  video.dataset.loopReady = '1';
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  if (!video.hasAttribute('controls')) {
    video.autoplay = true;
    video.setAttribute('autoplay', '');
    video.play().catch(() => {});
  }
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });
}

function initVideoLoops(root = document) {
  root.querySelectorAll('video').forEach(configureLoopingVideo);
}

function initVideoLoopObserver() {
  initVideoLoops();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'VIDEO') configureLoopingVideo(node);
        else initVideoLoops(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoLoopObserver);
} else {
  initVideoLoopObserver();
}
