(() => {
  'use strict';

  // Directory layout: every category stays expanded on the left (CSS, the native open/closed cookie is untouched),
  // and a sticky index of all categories sits on the right.
  function transformCategories() {
    const { el, setText } = window.CN5CH.utils;
    const groups = Array.from(document.querySelectorAll('details.category-group'));
    if (!groups.length) return;

    const h1 = document.querySelector('main#threadcontent > h1');
    if (h1 && !h1.dataset.cn5chEnhanced) {
      h1.dataset.cn5chEnhanced = '1';
      setText(h1, '全站板块分类目录', `（${h1.textContent.trim()}）`);
    }

    const columns = document.querySelector('.category-columns');
    if (!columns || document.querySelector('.cn5ch-cat-layout')) return;

    let boards = 0;
    const links = groups.map((group, i) => {
      if (!group.id) group.id = `cn5ch-cat-${i}`;
      boards += group.querySelectorAll('ul a').length;
      const name = group.querySelector('.category-name') || group.querySelector('summary');
      const count = group.querySelector('.category-count');
      return el('a', { href: `#${group.id}` }, [
        el('span', { text: name ? name.textContent.trim() : '' }),
        el('span', { className: 'cn5ch-cat-index-count notranslate', translate: 'no', text: count ? count.textContent.trim() : '' })
      ]);
    });

    const layout = el('div', { className: 'cn5ch-cat-layout' });
    columns.parentNode.insertBefore(layout, columns);
    layout.append(
      columns,
      el('aside', { className: 'cn5ch-cat-index cn5ch-injected', 'aria-label': '分区索引' }, [
        el('div', { className: 'cn5ch-side-heading', text: '分区索引' }),
        el('nav', { className: 'cn5ch-cat-index-list' }, links)
      ])
    );

    const tools = document.querySelector('.category-tools');
    if (tools) {
      tools.appendChild(el('span', { className: 'cn5ch-cat-stats cn5ch-injected', text: `${groups.length} 个分区 · ${boards} 个板块` }));
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.categories = transformCategories;
})();
