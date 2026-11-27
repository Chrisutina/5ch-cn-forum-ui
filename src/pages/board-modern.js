(() => {
  'use strict';

  function enhanceSubjectRows(table) {
    const { el, svgIcon } = window.CN5CH.utils;
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    let rank = 0;

    rows.forEach((tr) => {
      const titleCell = tr.querySelector('td.subject-title');
      const titleLink = titleCell ? titleCell.querySelector('a') : null;
      if (!titleLink) {
        if ((tr.textContent || '').includes('広告') || tr.querySelector('iframe, ins')) {
          tr.classList.add('cn5ch-ad-blocked');
        }
        return;
      }

      rank += 1;
      const numEl = titleCell.querySelector('.subject-number');
      if (numEl) {
        numEl.setAttribute('translate', 'no');
        numEl.classList.add('notranslate');
        numEl.classList.remove('is-top1', 'is-top2', 'is-top3');
        if (rank === 1) numEl.classList.add('is-top1');
        else if (rank === 2) numEl.classList.add('is-top2');
        else if (rank === 3) numEl.classList.add('is-top3');
      }

      const countCell = tr.querySelector('td.subject-count');
      const newCell = tr.querySelector('td.subject-new');
      const ikioiCell = tr.querySelector('td.subject-ikioi');

      if (newCell) {
        newCell.setAttribute('translate', 'no');
        newCell.classList.add('notranslate');
      }
      if (ikioiCell) {
        ikioiCell.setAttribute('translate', 'no');
        ikioiCell.classList.add('notranslate');
      }

      const countNum = countCell ? parseInt(countCell.textContent.replace(/[^\d]/g, ''), 10) || 0 : 0;
      const ikioiNum = ikioiCell ? parseInt(ikioiCell.textContent.replace(/[^\d]/g, ''), 10) || 0 : 0;
      const isHot = countNum >= 300 || ikioiNum >= 1500;

      if (countCell && !countCell.querySelector('.cn5ch-reply-pill')) {
        const rawText = countCell.textContent.trim();
        countCell.replaceChildren(
          el('span', {
            className: `cn5ch-reply-pill notranslate${isHot ? ' is-hot' : ''}`,
            translate: 'no',
            text: rawText
          })
        );
      }

      if (isHot && titleCell && !titleCell.querySelector('.cn5ch-badge-hot')) {
        titleLink.insertAdjacentElement(
          'beforebegin',
          el(
            'span',
            { className: 'cn5ch-badge cn5ch-badge-hot cn5ch-injected notranslate', translate: 'no' },
            [svgIcon('flame', 11), ikioiNum >= 3000 ? '爆' : '热']
          )
        );
      }
    });
  }

  function transformModernBoard() {
    const table = document.getElementById('subjects');
    if (table) {
      enhanceSubjectRows(table);
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const obs = new MutationObserver(() => enhanceSubjectRows(table));
        obs.observe(tbody, { childList: true });
      }
    }

    const { setText } = window.CN5CH.utils;
    const rulesSummary = document.querySelector('details#board-rules > summary');
    if (rulesSummary && !rulesSummary.dataset.cn5chLabeled) {
      rulesSummary.dataset.cn5chLabeled = '1';
      setText(rulesSummary, '版规公告', `（${rulesSummary.textContent.trim()}）`);
    }

    const newThreadSummary = document.querySelector('details#new-thread > summary');
    if (newThreadSummary && !newThreadSummary.dataset.cn5chLabeled) {
      newThreadSummary.dataset.cn5chLabeled = '1';
      setText(newThreadSummary, '＋ ', '发表新帖', `（${newThreadSummary.textContent.trim()}）`);
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages['board-modern'] = transformModernBoard;
})();
