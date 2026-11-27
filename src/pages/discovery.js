(() => {
  'use strict';

  function enhanceDiscoveryList(listEl) {
    if (!listEl) return;

    const items = listEl.querySelectorAll(':scope > li');
    items.forEach((li, idx) => {
      const pos = li.querySelector('.discovery-position');
      if (pos) {
        pos.setAttribute('translate', 'no');
        pos.classList.add('notranslate');
        pos.classList.remove('is-top1', 'is-top2', 'is-top3');
        const rank = parseInt(pos.textContent.replace(/[^\d]/g, ''), 10) || idx + 1;
        if (rank === 1) pos.classList.add('is-top1');
        else if (rank === 2) pos.classList.add('is-top2');
        else if (rank === 3) pos.classList.add('is-top3');
      }
    });
  }

  function transformDiscovery() {
    const listEl = document.getElementById('discovery-threads');
    if (listEl) {
      enhanceDiscoveryList(listEl);
      const obs = new MutationObserver(() => enhanceDiscoveryList(listEl));
      obs.observe(listEl, { childList: true });
    }

    const h1 = document.querySelector('main#threadcontent > h1');
    if (h1 && !h1.dataset.cn5chEnhanced) {
      h1.dataset.cn5chEnhanced = '1';
      window.CN5CH.utils.setText(h1, '5ch ', '全站实时热榜', `（${h1.textContent.trim()}）`);
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.discovery = transformDiscovery;
})();
