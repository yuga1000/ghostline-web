/**
 * Normalize the "manual" modal so artwork is fully visible on desktop.
 *
 * The markup for the manual modal is injected by third–party scripts and can
 * end up inside containers that apply clipping via `overflow:hidden` or
 * `transform`. When this happens a fixed positioned modal may be cropped. This
 * module ensures that on desktop the modal is portaled to `document.body`, any
 * inline sizing is cleared and the artwork uses `object-fit: contain` so the
 * entire piece is visible even if it requires letterboxing.
 */
(function(){
  const DESKTOP_QUERY = '(min-width: 1024px)';

  function isDesktop(){
    return window.matchMedia(DESKTOP_QUERY).matches;
  }

  function portalModal(){
    if (!isDesktop()) return;
    const modal = document.querySelector('.manual-modal');
    if (modal && modal.parentNode !== document.body){
      document.body.appendChild(modal);
    }
  }

  function getMediaAspectRatio(el){
    if (!el) return '';
    if (el.tagName === 'IMG' && el.naturalWidth && el.naturalHeight){
      return `${el.naturalWidth} / ${el.naturalHeight}`;
    }
    if (el.tagName === 'VIDEO' && el.videoWidth && el.videoHeight){
      return `${el.videoWidth} / ${el.videoHeight}`;
    }
    if (el.tagName === 'CANVAS' && el.width && el.height){
      return `${el.width} / ${el.height}`;
    }
    return '';
  }

  function normalizeManualModal(){
    if (!isDesktop()) return;
    const wrap = document.querySelector('.manual-wrap');
    const media = wrap?.querySelector('img,video,canvas');
    if (!wrap) return;

    ['width','height','transform','aspectRatio','maxWidth','maxHeight','overflow'].forEach(p => wrap.style[p] = '');
    wrap.style.overflow = 'auto';

    if (media){
      ['width','height','maxWidth','maxHeight','objectFit'].forEach(p => media.style[p] = '');
      media.style.objectFit = 'contain';
      const ratio = getMediaAspectRatio(media);
      if (ratio) wrap.style.aspectRatio = ratio;
    }
  }

  function closeModal(){
    const btn = document.querySelector(
      '.manual-modal .manual-close, .manual-modal .close, .manual-modal [data-action="close"]'
    );
    btn?.click();
  }

  function prevModal(){
    const btn = document.querySelector(
      '.manual-modal .manual-prev, .manual-modal .prev, .manual-modal [data-action="previous"]'
    );
    btn?.click();
  }

  function nextModal(){
    const btn = document.querySelector(
      '.manual-modal .manual-next, .manual-modal .next, .manual-modal [data-action="next"]'
    );
    btn?.click();
  }

  document.addEventListener('click', (e) => {
    const modal = document.querySelector('.manual-modal');
    if (!modal) return;
    const style = getComputedStyle(modal);
    if (style.display === 'none') return;
    const controlSelector = [
      '.manual-close',
      '.manual-prev',
      '.manual-next',
      '.close',
      '.prev',
      '.next',
      '[data-action="close"]',
      '[data-action="previous"]',
      '[data-action="next"]'
    ].join(', ');
    if (modal.contains(e.target) && !e.target.closest('.manual-wrap') && !e.target.closest(controlSelector)) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    const modal = document.querySelector('.manual-modal');
    if (!modal) return;
    const style = getComputedStyle(modal);
    if (style.display === 'none') return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      prevModal();
    } else if (e.key === 'ArrowRight') {
      nextModal();
    }
  });

  window.normalizeManualModal = normalizeManualModal;

  document.addEventListener('manual-modal-open', () => {
    portalModal();
    normalizeManualModal();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.manual-modal');
    if (!modal) return;
    portalModal();
    const observer = new MutationObserver(() => {
      const style = getComputedStyle(modal);
      if (style.display !== 'none') {
        normalizeManualModal();
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
  });
})();
