(() => {
  'use strict';

  function transformKako(settings, pageInfo) {
    const { el, setText } = window.CN5CH.utils;
    if (document.getElementById('cn5ch-kako-shell')) return;

    const boardSlug = pageInfo.board || '';
    const origin = window.location.origin;

    const h2 = document.querySelector('header h2');
    const titleText = (h2 ? h2.textContent.trim() : '') || document.title || `${boardSlug} 历史归档`;
    const totalEl = document.querySelector('header .total');
    const totalText = totalEl ? totalEl.textContent.trim() : '';

    // Parse archived threads
    const threads = [];
    document.querySelectorAll('.THREAD p.main_odd, .THREAD p.main_even').forEach((p, idx) => {
      const link = p.querySelector('.title a, a[href*="/test/read.cgi/"]');
      if (!link) return;
      const linesEl = p.querySelector('.lines');
      const count = linesEl ? parseInt(linesEl.textContent.replace(/[^\d]/g, ''), 10) || 0 : 0;
      const fileEl = p.querySelector('.filename');
      threads.push({
        index: idx + 1,
        title: link.textContent.trim(),
        href: link.href,
        count,
        filename: fileEl ? fileEl.textContent.trim() : ''
      });
    });

    // Parse date / page archive navigation links
    const archiveLinks = [];
    document.querySelectorAll('.LIST p.menu_link a, .LIST a').forEach((a) => {
      const text = a.textContent.trim();
      if (text && a.href) {
        archiveLinks.push({ text, href: a.href });
      }
    });

    // Hide raw legacy DOM (with broken overflow:hidden grid & .AD00/.AD10 banners) cleanly
    Array.from(document.body.children).forEach((node) => {
      if (!node.classList.contains('cn5ch-injected')) {
        node.classList.add('cn5ch-legacy-hidden');
      }
    });

    let keyword = '';
    const listCard = el('div', { className: 'cn5ch-card cn5ch-thread-list-card' });
    const countBadge = el('span', {
      className: 'cn5ch-badge cn5ch-badge-board notranslate',
      translate: 'no',
      text: `本页 ${threads.length} 帖`
    });

    function render() {
      const q = keyword.trim().toLowerCase();
      const filtered = threads.filter((t) => !q || t.title.toLowerCase().includes(q));
      setText(countBadge, `显示 ${filtered.length} / ${threads.length} 帖`);
      listCard.replaceChildren();

      if (!filtered.length) {
        listCard.appendChild(
          el('div', { className: 'cn5ch-empty', text: '没有匹配结果' })
        );
        return;
      }

      const frag = document.createDocumentFragment();
      filtered.forEach((t) => {
        const isHot = t.count >= 500;
        frag.appendChild(
          el('div', { className: 'cn5ch-thread-row' }, [
            el('div', {
              className: `cn5ch-reply-pill notranslate${isHot ? ' is-hot' : ''}`,
              translate: 'no',
              text: String(t.count)
            }),
            el('a', { className: 'cn5ch-thread-row-title', href: t.href, text: t.title }),
            el('div', { className: 'cn5ch-thread-row-meta notranslate', translate: 'no', text: `#${t.index}` })
          ])
        );
      });
      listCard.appendChild(frag);
    }

    const searchBar = el('div', { className: 'cn5ch-card cn5ch-board-controls' }, [
      el('input', {
        type: 'search',
        placeholder: '搜索历史归档帖子标题…',
        onInput: (ev) => {
          keyword = ev.target.value || '';
          render();
        }
      }),
      countBadge
    ]);

    const sideCard = el('aside', { className: 'cn5ch-card cn5ch-kako-side' }, [
      el('div', { className: 'cn5ch-side-heading', text: '归档目录' }),
      el(
        'div',
        { className: 'cn5ch-kako-dates' },
        archiveLinks.length
          ? archiveLinks.slice(0, 120).map((it) => el('a', { href: it.href, text: it.text }))
          : [el('span', { className: 'cn5ch-empty', text: '暂无其他归档目录' })]
      )
    ]);

    const shell = el('main', { id: 'cn5ch-kako-shell', className: 'cn5ch-board-shell cn5ch-injected' }, [
      el('div', { className: 'cn5ch-card cn5ch-board-hero' }, [
        el('div', {}, [
          el('h1', {}, [`${titleText} · `, '历史归档']),
          el('div', { className: 'cn5ch-board-hero-sub', text: totalText || '已清理广告，标题可搜索' })
        ]),
        el('div', { className: 'cn5ch-board-hero-actions' }, [
          boardSlug
            ? el('a', {
                className: 'cn5ch-btn cn5ch-btn-primary',
                href: `${origin}/test/read.cgi/${boardSlug}`,
                text: '返回当前板块'
              })
            : null,
          el('a', {
            className: 'cn5ch-btn',
            href: 'https://kako.5ch.io/',
            text: '全站归档目录'
          })
        ])
      ]),
      el('div', { className: 'cn5ch-kako-layout' }, [el('div', {}, [searchBar, listCard]), sideCard])
    ]);

    document.body.appendChild(shell);
    render();
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.kako = transformKako;
})();
