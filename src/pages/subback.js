(() => {
  'use strict';

  function transformSubback(settings, pageInfo) {
    const { el, setText, parseThreadLinkText } = window.CN5CH.utils;
    if (document.getElementById('cn5ch-subback-shell')) return;

    const boardSlug = pageInfo.board || '';
    const origin = window.location.origin;

    // Extract all thread links from #trad or body
    const rawLinks = Array.from(document.querySelectorAll('#trad a, a[href*="/test/read.cgi/"], a[href*="/l50"]'));
    const seen = new Set();
    const threads = [];

    rawLinks.forEach((a) => {
      const href = a.href;
      if (!href || seen.has(href)) return;
      const parsed = parseThreadLinkText(a.textContent);
      if (parsed.index === null && parsed.count === null) return;
      seen.add(href);
      threads.push({
        href,
        index: parsed.index ?? threads.length + 1,
        title: parsed.title,
        count: parsed.count ?? 0
      });
    });

    if (!threads.length) return;

    // Hide raw legacy wall of links cleanly (restored automatically if extension disabled)
    Array.from(document.body.children).forEach((node) => {
      if (!node.classList.contains('cn5ch-injected')) {
        node.classList.add('cn5ch-subback-hidden');
      }
    });

    let keyword = '';
    let sortMode = 'default'; // 'default' | 'desc' | 'asc'
    let hotOnly = false;

    const countBadge = el('span', { className: 'cn5ch-badge cn5ch-badge-board', text: `${threads.length} 帖` });
    const listWrap = el('div', { className: 'cn5ch-card cn5ch-thread-list-card' });

    function render() {
      const q = keyword.trim().toLowerCase();
      let rows = threads.filter((t) => {
        if (hotOnly && t.count < 100) return false;
        if (q && !t.title.toLowerCase().includes(q)) return false;
        return true;
      });

      if (sortMode === 'desc') {
        rows = [...rows].sort((a, b) => b.count - a.count);
      } else if (sortMode === 'asc') {
        rows = [...rows].sort((a, b) => a.count - b.count);
      }

      setText(countBadge, `显示 ${rows.length} / ${threads.length} 帖`);
      listWrap.replaceChildren();

      if (!rows.length) {
        listWrap.appendChild(
          el('div', { className: 'cn5ch-empty', text: '没有匹配结果' })
        );
        return;
      }

      const frag = document.createDocumentFragment();
      rows.forEach((t) => {
        const isHot = t.count >= 300;
        frag.appendChild(
          el('div', { className: 'cn5ch-thread-row' }, [
            el('div', {
              className: `cn5ch-reply-pill${isHot ? ' is-hot' : ''}`,
              title: '回复数',
              text: String(t.count)
            }),
            el('div', {}, [
              isHot ? el('span', { className: 'cn5ch-badge cn5ch-badge-hot', text: '热' }) : null,
              el('a', { className: 'cn5ch-thread-row-title', href: t.href, text: t.title })
            ]),
            el('div', { className: 'cn5ch-thread-row-meta', text: `#${t.index}` })
          ])
        );
      });
      listWrap.appendChild(frag);
    }

    const sortBtns = {};
    const setSort = (mode) => {
      sortMode = mode;
      Object.entries(sortBtns).forEach(([k, btn]) => btn.classList.toggle('is-active', k === mode));
      render();
    };

    sortBtns.default = el('button', { type: 'button', className: 'cn5ch-btn is-active', text: '默认顺序', onClick: () => setSort('default') });
    sortBtns.desc = el('button', { type: 'button', className: 'cn5ch-btn', text: '回复最多', onClick: () => setSort('desc') });
    sortBtns.asc = el('button', { type: 'button', className: 'cn5ch-btn', text: '回复最少', onClick: () => setSort('asc') });

    const btnHot = el('button', {
      type: 'button',
      className: 'cn5ch-btn cn5ch-btn-toggle',
      text: '只看 100+ 热帖',
      onClick: () => {
        hotOnly = !hotOnly;
        btnHot.classList.toggle('is-active', hotOnly);
        render();
      }
    });

    const boardHeading = document.title ? document.title.replace(/スレッド一覧.*/, '').trim() : boardSlug;

    const shell = el('main', { id: 'cn5ch-subback-shell', className: 'cn5ch-board-shell cn5ch-injected' }, [
      el('div', { className: 'cn5ch-card cn5ch-board-hero' }, [
        el('div', {}, [
          el('h1', {}, [`${boardHeading || boardSlug} · `, '全部主题列表']),
          el('div', { className: 'cn5ch-board-hero-sub', text: '可搜索、可排序' })
        ]),
        el('div', { className: 'cn5ch-board-hero-actions' }, [
          countBadge,
          boardSlug
            ? el('a', {
                className: 'cn5ch-btn cn5ch-btn-primary',
                href: `${origin}/test/read.cgi/${boardSlug}`,
                text: '新版板块列表'
              })
            : null,
          boardSlug
            ? el('a', {
                className: 'cn5ch-btn',
                href: `${origin}/${boardSlug}/`,
                text: '板块首页'
              })
            : null
        ])
      ]),
      el('div', { className: 'cn5ch-card cn5ch-board-controls' }, [
        el('input', {
          type: 'search',
          placeholder: '搜索帖子标题…',
          onInput: (ev) => {
            keyword = ev.target.value || '';
            render();
          }
        }),
        sortBtns.default,
        sortBtns.desc,
        sortBtns.asc,
        btnHot
      ]),
      listWrap
    ]);

    document.body.appendChild(shell);
    render();
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.subback = transformSubback;
})();
