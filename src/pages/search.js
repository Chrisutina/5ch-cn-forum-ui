(() => {
  'use strict';

  function transformSearch() {
    const { el, svgIcon } = window.CN5CH.utils;
    const listEl = document.querySelector('#js-mainview .list, .container-search .list');
    if (!listEl) return;

    const lines = Array.from(listEl.querySelectorAll('.list_line'));
    lines.forEach((line) => {
      if (line.dataset.cn5chEnhanced === '1') return;
      line.dataset.cn5chEnhanced = '1';

      // reply count leaves the title and joins the meta row, as on the home feed
      const titleEl = line.querySelector('.list_line_link_title');
      const infoEl = line.querySelector('.list_line_info');
      if (titleEl) {
        const raw = titleEl.textContent.trim();
        const m = raw.match(/^(.*?)\s*\((\d+)\)\s*$/);
        if (m) {
          titleEl.textContent = m[1].trim();
          const pill = el('span', { className: 'cn5ch-stat-pill notranslate', translate: 'no' }, [
            svgIcon('messageSquare', 12),
            `${m[2]} 回复`
          ]);
          if (infoEl) infoEl.prepend(el('div', { className: 'list_line_info_container cn5ch-injected' }, [pill]));
        }
      }
    });

    const mainView = document.getElementById('js-mainview');
    if (mainView && !mainView.querySelector('.cn5ch-search-summary')) {
      const q = new URLSearchParams(window.location.search).get('q') || '';
      const summary = el(
        'div',
        { className: 'cn5ch-search-summary cn5ch-injected' },
        [
          el('span', {}, q ? [`「${q}」`, '的搜索结果', ` · ${lines.length} `, '帖'] : [`${lines.length} `, '条结果']),
          el('span', { className: 'cn5ch-badge cn5ch-badge-new', text: '已清理广告' })
        ]
      );
      mainView.prepend(summary);
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.search = transformSearch;
})();
