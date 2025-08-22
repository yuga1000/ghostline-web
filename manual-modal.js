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

  function normalizeManualModal(){
    if (!isDesktop()) return;
    const wrap = document.querySelector('.manual-wrap');
    const media = wrap?.querySelector('img,video,canvas');
    if (!wrap) return;

    ['width','height','transform'].forEach(p => wrap.style[p] = '');
    wrap.style.maxWidth = 'calc(100vw - 64px)';
    wrap.style.maxHeight = 'calc(100vh - 64px)';
    wrap.style.overflow = 'auto';

    if (media){
      ['width','height'].forEach(p => media.style[p] = '');
      media.style.maxWidth = '100%';
      media.style.maxHeight = '100%';
      media.style.objectFit = 'contain';
    }
  }

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
