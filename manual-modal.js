(function(){
  function normalizeManualModal(){
    const wrap = document.querySelector('.manual-wrap');
    const media = wrap?.querySelector('img,video,canvas');
    if (!wrap) return;
    ['width','height','transform'].forEach(p => wrap.style[p] = '');
    if (media){
      ['width','height'].forEach(p => media.style[p] = '');
      media.style.objectFit = 'contain';
    }
  }
  window.normalizeManualModal = normalizeManualModal;

  document.addEventListener('manual-modal-open', normalizeManualModal);

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.manual-modal');
    if (!modal) return;
    const observer = new MutationObserver(() => {
      const style = getComputedStyle(modal);
      if (style.display !== 'none') {
        normalizeManualModal();
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
  });
})();
