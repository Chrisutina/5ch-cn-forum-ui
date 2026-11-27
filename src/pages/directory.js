(() => {
  'use strict';

  function parseDirectoryCategories() {
    const categories = [];
    // Walk through <b>Category</b> and subsequent <a> board links in DOM order
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let current = null;
    let node = walker.nextNode();

    while (node) {
      if (node.closest('.cn5ch-injected')) {
        node = walker.nextNode();
        continue;
      }
      const tag = node.tagName;
      if (tag === 'B' || tag === 'H2' || tag === 'H3') {
        const name = (node.textContent || '').trim();
        if (name && name.length <= 36 && !node.querySelector('a')) {
          current = { name, boards: [] };
          categories.push(current);
        }
      } else if (tag === 'A' && current) {
        const href = node.href || '';
        const text = (node.textContent || '').trim();
        if (text && /^https?:\/\/[^/]*5ch\.(io|net)\//i.test(href)) {
          current.boards.push({ name: text, href });
        }
      }
      node = walker.nextNode();
    }

    return categories.filter((c) => c.boards.length > 0);
  }

  function transformDirectory() {
    const { el } = window.CN5CH.utils;
    if (document.getElementById('cn5ch-dir-shell')) return;

    const categories = parseDirectoryCategories();
    if (!categories.length) return;

    const totalBoards = categories.reduce((acc, c) => acc + c.boards.length, 0);

    // Hide raw 1990s sidebar / frameset HTML cleanly
    Array.from(document.body.children).forEach((node) => {
      if (!node.classList.contains('cn5ch-injected')) {
        node.classList.add('cn5ch-legacy-hidden');
      }
    });

    let keyword = '';
    const grid = el('div', { className: 'cn5ch-dir-grid' });
    const indexList = el('nav', { className: 'cn5ch-cat-index-list' });
    const statBadge = el('span', {
      className: 'cn5ch-badge cn5ch-badge-board',
      text: `${categories.length} 个分区 · ${totalBoards} 个板块`
    });

    function render() {
      const q = keyword.trim().toLowerCase();
      grid.replaceChildren();
      indexList.replaceChildren();

      let visibleGroups = 0;
      categories.forEach((cat, idx) => {
        const catMatch = !q || cat.name.toLowerCase().includes(q);
        const boards = catMatch ? cat.boards : cat.boards.filter((b) => b.name.toLowerCase().includes(q));
        if (!boards.length) return;
        visibleGroups += 1;

        // the index on the right lists only the categories that survive the filter
        indexList.appendChild(
          el('a', { href: `#cn5ch-dir-${idx}` }, [
            el('span', { text: cat.name }),
            el('span', { className: 'cn5ch-cat-index-count notranslate', translate: 'no', text: `${boards.length}` })
          ])
        );

        grid.appendChild(
          el('section', { className: 'cn5ch-dir-card', id: `cn5ch-dir-${idx}` }, [
            el('div', { className: 'cn5ch-dir-card-title' }, [
              el('span', { text: cat.name }),
              el('span', { className: 'cn5ch-dir-card-count notranslate', translate: 'no', text: `${boards.length}` })
            ]),
            el(
              'div',
              { className: 'cn5ch-dir-links' },
              boards.map((b) => el('a', { href: b.href, text: b.name }))
            )
          ])
        );
      });

      if (!visibleGroups) {
        grid.appendChild(
          el('div', { className: 'cn5ch-empty', text: '没有匹配结果' })
        );
      }
    }

    const shell = el('main', { id: 'cn5ch-dir-shell', className: 'cn5ch-board-shell cn5ch-injected' }, [
      el('div', { className: 'cn5ch-card cn5ch-board-hero' }, [
        el('div', {}, [
          el('h1', { text: '5ch 全站板块导航' }),
          el('div', { className: 'cn5ch-board-hero-sub', text: '按分区平铺全部板块，右侧索引可快速跳转' })
        ]),
        statBadge
      ]),
      el('div', { className: 'cn5ch-card cn5ch-board-controls' }, [
        el('input', {
          type: 'search',
          placeholder: '搜索板块或分区，例：ニュース / ゲーム…',
          onInput: (ev) => {
            keyword = ev.target.value || '';
            render();
          }
        })
      ]),
      el('div', { className: 'cn5ch-cat-layout' }, [
        grid,
        el('aside', { className: 'cn5ch-cat-index cn5ch-injected', 'aria-label': '分区索引' }, [
          el('div', { className: 'cn5ch-side-heading', text: '分区索引' }),
          indexList
        ])
      ])
    ]);

    document.body.appendChild(shell);
    render();
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.directory = transformDirectory;
})();
