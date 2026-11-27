(() => {
  'use strict';

  function transformLegacyBoard(settings, pageInfo) {
    const { el, parseThreadLinkText, unwrapLinksInContainer, attachSlidingIndicator } = window.CN5CH.utils;
    if (document.getElementById('cn5ch-legacy-shell')) return;

    const boardSlug = pageInfo.board || '';
    const origin = window.location.origin;

    // Collect board title
    const h2 = document.querySelector('.RIGHT_MAIN h2, h2, h1');
    const boardTitle = (h2 ? h2.textContent.trim() : '') || document.title || boardSlug || '5ch 板块';

    // Collect board header / rules
    const boardHeaderEl = document.querySelector('.board_header');

    // Collect thread links (#menu list)
    const seenUrls = new Set();
    const threads = [];
    document.querySelectorAll('a[href*="/test/read.cgi/"]').forEach((a) => {
      const href = a.href;
      if (!href || seenUrls.has(href)) return;
      const parsed = parseThreadLinkText(a.textContent);
      if (parsed.index === null && parsed.count === null) return;
      seenUrls.add(href);
      threads.push({
        href,
        index: parsed.index || threads.length + 1,
        title: parsed.title,
        count: parsed.count ?? 0
      });
    });

    // Collect thread preview blocks (<dl class="thread">)
    const previewBlocks = [];
    document.querySelectorAll('dl.thread').forEach((dl, idx) => {
      const prevEl = dl.previousElementSibling;
      const title = prevEl && /^H[2-4]$/i.test(prevEl.tagName) ? prevEl.textContent.trim() : `热门主题预览 #${idx + 1}`;
      const dts = dl.querySelectorAll('dt');
      const dds = dl.querySelectorAll('dd');
      const items = [];
      for (let i = 0; i < Math.min(dts.length, dds.length, 6); i += 1) {
        items.push({
          meta: dts[i].textContent.trim(),
          body: dds[i].textContent.trim().slice(0, 320)
        });
      }
      if (items.length) {
        previewBlocks.push({ title, items });
      }
    });

    // Locate native new thread form (preserve Shift_JIS submission!)
    const allForms = Array.from(document.querySelectorAll('form[action*="bbs.cgi"]'));
    const newThreadForm = allForms.find((f) => f.querySelector('input[name="subject"]')) || null;
    const origFormParent = newThreadForm ? newThreadForm.parentNode : null;
    const origFormNext = newThreadForm ? newThreadForm.nextSibling : null;

    // Hide raw legacy DOM children cleanly (reversible when disabled!)
    const legacyNodes = Array.from(document.body.children).filter(
      (node) => !node.classList.contains('cn5ch-injected')
    );
    legacyNodes.forEach((node) => node.classList.add('cn5ch-legacy-hidden'));

    // Build Tieba-style thread list panel
    let searchKeyword = '';
    let sortBy = 'default';

    const listContainer = el('div', { className: 'cn5ch-thread-list-card' });

    function renderThreadList() {
      const q = searchKeyword.trim().toLowerCase();
      let items = threads.filter((t) => !q || t.title.toLowerCase().includes(q));
      if (sortBy === 'replies') {
        items = [...items].sort((a, b) => b.count - a.count);
      }

      listContainer.replaceChildren();
      if (!items.length) {
        listContainer.appendChild(
          el('div', { className: 'cn5ch-empty', text: '没有匹配结果' })
        );
        return;
      }

      items.forEach((t) => {
        const isHot = t.count >= 200;
        listContainer.appendChild(
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
    }

    renderThreadList();

    // Controls inside Thread List tab
    const btnDefaultSort = el('button', {
      type: 'button',
      className: 'cn5ch-btn is-active',
      text: '默认顺序',
      onClick: () => {
        sortBy = 'default';
        btnDefaultSort.classList.add('is-active');
        btnReplySort.classList.remove('is-active');
        renderThreadList();
      }
    });

    const btnReplySort = el('button', {
      type: 'button',
      className: 'cn5ch-btn',
      text: '回复最多',
      onClick: () => {
        sortBy = 'replies';
        btnReplySort.classList.add('is-active');
        btnDefaultSort.classList.remove('is-active');
        renderThreadList();
      }
    });

    const tabListPanel = el('div', {}, [
      el('div', { className: 'cn5ch-board-controls' }, [
        el('input', {
          type: 'search',
          placeholder: '搜索本板块帖子标题…',
          onInput: (ev) => {
            searchKeyword = ev.target.value || '';
            renderThreadList();
          }
        }),
        btnDefaultSort,
        btnReplySort
      ]),
      listContainer
    ]);

    // Previews panel
    const tabPreviewPanel = el(
      'div',
      { className: 'cn5ch-preview-panel', style: { display: 'none' } },
      previewBlocks.length
        ? previewBlocks.map((b) =>
            el(
              'div',
              { className: 'cn5ch-preview-block' },
              [
                el('h3', { className: 'cn5ch-preview-title', text: b.title }),
                ...b.items.map((it) =>
                  el('div', { className: 'cn5ch-preview-item' }, [
                    el('div', { className: 'cn5ch-preview-meta', text: it.meta }),
                    el('div', { className: 'cn5ch-preview-body', text: it.body })
                  ])
                )
              ]
            )
          )
        : [el('div', { className: 'cn5ch-empty', text: '没有正文预览' })]
    );

    // New thread form panel
    const tabNewThreadPanel = el('div', { className: 'formbox cn5ch-newthread-panel', style: { display: 'none' } });
    if (newThreadForm) {
      tabNewThreadPanel.appendChild(
        el('div', { className: 'cn5ch-newthread-title', text: '在本板块发表新主题' })
      );
      tabNewThreadPanel.appendChild(newThreadForm);
    } else {
      tabNewThreadPanel.appendChild(
        el('div', { className: 'cn5ch-empty', text: '本页没有发帖表单，请到新版板块页发帖' })
      );
    }

    // Tabs switching
    const panels = { list: tabListPanel, preview: tabPreviewPanel, post: tabNewThreadPanel };
    const tabButtons = {};
    let syncTabs = () => {};
    const switchTab = (key) => {
      Object.entries(panels).forEach(([k, p]) => {
        p.style.display = k === key ? '' : 'none';
      });
      Object.entries(tabButtons).forEach(([k, b]) => {
        b.classList.toggle('is-active', k === key);
      });
      requestAnimationFrame(syncTabs);
    };

    const countEl = (n) => el('span', { className: 'cn5ch-count notranslate', translate: 'no', text: String(n) });
    tabButtons.list = el('button', { type: 'button', className: 'cn5ch-tab-pill is-active', onClick: () => switchTab('list') }, ['帖子列表', countEl(threads.length)]);
    tabButtons.preview = el('button', { type: 'button', className: 'cn5ch-tab-pill', onClick: () => switchTab('preview') }, ['热帖正文预览', countEl(previewBlocks.length)]);
    tabButtons.post = el('button', { type: 'button', className: 'cn5ch-tab-pill', text: '发表新帖', onClick: () => switchTab('post') });
    const tabGroup = el('div', { className: 'cn5ch-tab-group', role: 'tablist' }, [tabButtons.list, tabButtons.preview, tabButtons.post]);

    // Rules accordion
    let rulesAccordion = null;
    if (boardHeaderEl) {
      const rulesClone = boardHeaderEl.cloneNode(true);
      unwrapLinksInContainer(rulesClone, settings.unwrapJumpLinks);
      rulesAccordion = el('details', { className: 'cn5ch-rules-accordion' }, [
        el('summary', { text: '板块公告与本地规则（点击展开）' }),
        el('div', { className: 'cn5ch-rules-body' }, [rulesClone])
      ]);
    }

    const shell = el('main', { id: 'cn5ch-legacy-shell', className: 'cn5ch-board-shell cn5ch-injected' }, [
      el('div', { className: 'cn5ch-card cn5ch-board-hero' }, [
        el('div', {}, [
          el('h1', { text: boardTitle }),
          el('div', { className: 'cn5ch-board-hero-sub', text: `板块代码：${boardSlug || '-'} · 本页 ${threads.length} 帖` })
        ]),
        el('div', { className: 'cn5ch-board-hero-actions' }, [
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
                href: `${origin}/${boardSlug}/subback.html`,
                text: '查看全部主题 (Subback)'
              })
            : null
        ])
      ]),
      rulesAccordion,
      el('div', { className: 'cn5ch-legacy-panel' }, [
        el('div', { className: 'cn5ch-tabs' }, [tabGroup]),
        tabListPanel,
        tabPreviewPanel,
        tabNewThreadPanel
      ])
    ]);

    document.body.appendChild(shell);
    syncTabs = attachSlidingIndicator(tabGroup, '.cn5ch-tab-pill.is-active');

    // Restore native form back to original parent if user turns extension OFF
    window.CN5CH.config.subscribe((next) => {
      if (!next.enabled && newThreadForm && origFormParent) {
        origFormParent.insertBefore(newThreadForm, origFormNext);
      } else if (next.enabled && newThreadForm && newThreadForm.parentNode !== tabNewThreadPanel) {
        tabNewThreadPanel.appendChild(newThreadForm);
      }
    });
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages['board-legacy'] = transformLegacyBoard;
})();
