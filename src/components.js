(() => {
  'use strict';

  const THEMES = [
    { id: 'shadcn', label: '极简白' },
    { id: 'nga', label: '羊皮纸' },
    { id: 'dark', label: '极简黑' }
  ];

  // Cross-fade the whole page on theme change (View Transitions); plain switch when unsupported or reduced motion
  function switchTheme(id, onUpdateSettings) {
    const apply = () => onUpdateSettings({ theme: id });
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof document.startViewTransition === 'function' && !reduce) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  function getDomainBase() {
    const host = (window.location.hostname || '').toLowerCase();
    return host.endsWith('.5ch.net') || host === '5ch.net' ? '5ch.net' : '5ch.io';
  }

  function mountScrollProgress() {
    if (document.getElementById('cn5ch-progress')) return;
    const { el } = window.CN5CH.utils;
    const bar = el('div', { id: 'cn5ch-progress-bar' });
    const wrap = el('div', { id: 'cn5ch-progress', className: 'cn5ch-injected' }, [bar]);
    document.body.prepend(wrap);

    let ticking = false;
    const update = () => {
      ticking = false;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = `scaleX(${ratio})`;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  function mountTopbar(settings, pageInfo, onUpdateSettings) {
    if (document.getElementById('cn5ch-topbar')) return;
    const { el, svgIcon, attachSlidingIndicator } = window.CN5CH.utils;
    const domain = getDomainBase();
    const origin = window.location.origin;

    const isBoardHost =
      window.location.hostname &&
      !/^(?:www\.|www2\.|find\.|menu\.|kako\.)?5ch\.(?:io|net)$/i.test(window.location.hostname);

    const navItems = [
      { label: '热门广场', href: `https://${domain}/`, active: pageInfo.type === 'home' },
      {
        label: '实时热榜',
        href: isBoardHost ? `${origin}/test/read.cgi/` : `https://asahi.${domain}/test/read.cgi/`,
        active: pageInfo.type === 'discovery'
      },
      {
        label: '全站板块',
        href: isBoardHost ? `${origin}/test/read.cgi/categories` : `https://asahi.${domain}/test/read.cgi/categories`,
        active: pageInfo.type === 'directory' || pageInfo.type === 'categories'
      }
    ];

    if (pageInfo.board) {
      navItems.push({
        label: `板块 · ${pageInfo.board}`,
        href: `${origin}/test/read.cgi/${pageInfo.board}`,
        active:
          pageInfo.type === 'board-modern' ||
          pageInfo.type === 'board-legacy' ||
          pageInfo.type === 'subback' ||
          pageInfo.type === 'kako'
      });
    }

    const searchInput = el('input', {
      type: 'search',
      name: 'q',
      placeholder: '搜索帖子标题…',
      'aria-label': '全站搜索帖子标题'
    });

    if (pageInfo.type === 'search') {
      const qParam = new URLSearchParams(window.location.search).get('q');
      if (qParam) searchInput.value = qParam;
    }

    // Press "/" outside inputs to jump directly into search (21st.dev / Linear shortcut)
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
        return;
      }
      if (document.documentElement.dataset.cn5chEnabled !== '1') return;
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
    });

    const searchForm = el(
      'form',
      {
        className: 'cn5ch-top-search',
        action: `https://find.${domain}/search`,
        method: 'GET'
      },
      [svgIcon('search', 14), searchInput, el('kbd', { className: 'cn5ch-kbd notranslate', translate: 'no', text: '/' })]
    );

    const activeTheme = THEMES.some((t) => t.id === settings.theme) ? settings.theme : 'shadcn';
    const themeButtons = THEMES.map((t) =>
      el('button', {
        type: 'button',
        className: `cn5ch-theme-btn${activeTheme === t.id ? ' is-active' : ''}`,
        dataset: { themeId: t.id },
        text: t.label,
        onClick: () => {
          switchTheme(t.id, onUpdateSettings);
          window.CN5CH.utils.showToast(`已切换主题：${t.label}`);
        }
      })
    );

    const themeSwitcher = el(
      'div',
      { className: 'cn5ch-segmented', role: 'group', 'aria-label': '切换主题' },
      themeButtons
    );

    const toggleOriginBtn = el(
      'button',
      {
        type: 'button',
        className: 'cn5ch-toggle-origin-btn',
        title: '临时关闭美化，显示 5ch 原版页面',
        onClick: () => onUpdateSettings({ enabled: false })
      },
      [svgIcon('rotateCcw', 13), el('span', { text: '原版' })]
    );

    const topbar = el('header', { id: 'cn5ch-topbar', className: 'cn5ch-injected' }, [
      el('div', { className: 'cn5ch-topbar-inner' }, [
        el('a', { className: 'cn5ch-brand', href: `https://${domain}/` }, [
          el('span', { className: 'cn5ch-brand-badge notranslate', translate: 'no', text: '5ch' }),
          el('span', { text: '社区' })
        ]),
        el(
          'nav',
          { className: 'cn5ch-nav-links', 'aria-label': '主导航' },
          navItems.map((item) =>
            el('a', {
              className: `cn5ch-nav-link${item.active ? ' is-active' : ''}`,
              href: item.href,
              text: item.label
            })
          )
        ),
        searchForm,
        el('div', { className: 'cn5ch-topbar-actions' }, [themeSwitcher, toggleOriginBtn])
      ])
    ]);

    document.body.prepend(topbar);
    document.body.classList.add('cn5ch-has-topbar');

    if (pageInfo.type === 'thread') {
      mountScrollProgress();
    }

    const syncSlider = attachSlidingIndicator(themeSwitcher, '.cn5ch-theme-btn.is-active');

    window.CN5CH.config.subscribe((next) => {
      const targetId = THEMES.some((t) => t.id === next.theme) ? next.theme : 'shadcn';
      themeButtons.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.themeId === targetId);
      });
      requestAnimationFrame(syncSlider);
    });
  }

  function mountFloatingActions(pageInfo, onUpdateSettings) {
    if (document.getElementById('cn5ch-fab')) return;
    const { el, svgIcon, showToast } = window.CN5CH.utils;

    const buttons = [
      el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-fab-btn',
          title: '返回顶部',
          'aria-label': '返回顶部',
          onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        [svgIcon('arrowUp', 16)]
      )
    ];

    if (pageInfo.type === 'thread') {
      buttons.push(
        el(
          'button',
          {
            type: 'button',
            className: 'cn5ch-fab-btn',
            title: '直达底部回帖框',
            'aria-label': '直达底部回帖框',
            onClick: () => {
              const box = document.querySelector('.formbox, form[action*="bbs.cgi"]');
              if (box) {
                box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const textarea = box.querySelector('textarea[name="MESSAGE"]');
                if (textarea) textarea.focus();
              } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }
            }
          },
          [svgIcon('messageSquare', 16)]
        )
      );
    }

    buttons.push(
      el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-fab-btn',
          title: '切换主题（极简白 / 羊皮纸 / 极简黑）',
          'aria-label': '切换主题',
          onClick: () => {
            const cur = window.CN5CH.config.current.theme || 'shadcn';
            const idx = Math.max(0, THEMES.findIndex((t) => t.id === cur));
            const next = THEMES[(idx + 1) % THEMES.length];
            switchTheme(next.id, onUpdateSettings);
            showToast(`已切换主题：${next.label}`);
          }
        },
        [svgIcon('palette', 16)]
      )
    );

    const fab = el('div', { id: 'cn5ch-fab', className: 'cn5ch-injected' }, buttons);
    document.body.appendChild(fab);
  }

  function ensureLightbox() {
    let box = document.getElementById('cn5ch-lightbox');
    if (box) return box.__api;
    const { el, svgIcon } = window.CN5CH.utils;

    const img = el('img', { alt: '大图预览', referrerpolicy: 'no-referrer' });
    const closeBtn = el(
      'button',
      {
        type: 'button',
        className: 'cn5ch-lightbox-close',
        'aria-label': '关闭大图'
      },
      [svgIcon('x', 18)]
    );

    box = el('div', { id: 'cn5ch-lightbox', className: 'cn5ch-injected' }, [img, closeBtn]);
    document.body.appendChild(box);

    const close = () => {
      box.classList.remove('is-open');
      setTimeout(() => {
        if (!box.classList.contains('is-open')) img.removeAttribute('src');
      }, 220);
    };

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (ev) => {
      if (ev.target === box) close();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && box.classList.contains('is-open')) {
        close();
      }
    });

    box.__api = {
      open(url) {
        if (!url) return;
        img.src = url;
        box.classList.add('is-open');
      },
      close
    };
    return box.__api;
  }

  function ensureQuotePopup() {
    let popup = document.getElementById('cn5ch-quote-popup');
    if (popup) return popup.__api;
    const { el } = window.CN5CH.utils;

    popup = el('div', { id: 'cn5ch-quote-popup', className: 'cn5ch-injected' });
    document.body.appendChild(popup);

    let hideTimer = null;

    popup.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
    });
    popup.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => popup.classList.remove('is-open'), 160);
    });

    popup.__api = {
      show(anchorRect, postData) {
        clearTimeout(hideTimer);
        popup.replaceChildren();

        const head = el('div', { className: 'cn5ch-quote-popup-head' }, [floorMeta(postData)]);

        const body = el('div', { className: 'cn5ch-quote-popup-body' });
        if (postData.contentNode) {
          const cloned = postData.contentNode.cloneNode(true);
          cloned
            .querySelectorAll('a.image-thumb, .image-blurred, .image-inline, .cn5ch-inline-gallery, .cn5ch-quote-dedup')
            .forEach((n) => n.remove());
          body.appendChild(cloned);
        } else {
          window.CN5CH.utils.setText(body, postData.text || '不在本页');
        }

        popup.appendChild(head);
        popup.appendChild(body);
        popup.classList.add('is-open');

        const pad = 12;
        const rect = popup.getBoundingClientRect();
        let left = anchorRect.left;
        if (left + rect.width > window.innerWidth - pad) {
          left = Math.max(pad, window.innerWidth - rect.width - pad);
        }
        let top = anchorRect.bottom + 8;
        if (top + rect.height > window.innerHeight - pad) {
          top = Math.max(pad, anchorRect.top - rect.height - 8);
        }
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
      },
      scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => popup.classList.remove('is-open'), 180);
      }
    };

    return popup.__api;
  }

  // One meta line for every place that names a floor (preview popup, 楼中楼, hot list, quote line):
  // 67F · [楼主] · author · date · ID — same order, same type everywhere
  function floorMeta({ num, isOp, author, date, uid }) {
    const { el } = window.CN5CH.utils;
    return el('span', { className: 'cn5ch-meta' }, [
      el('strong', { className: 'cn5ch-meta-num notranslate', translate: 'no', text: `${num}F` }),
      isOp ? el('span', { className: 'cn5ch-badge cn5ch-badge-op notranslate', translate: 'no', text: '楼主' }) : null,
      author ? el('span', { className: 'cn5ch-meta-author', text: author }) : null,
      date ? el('span', { className: 'cn5ch-meta-date notranslate', translate: 'no', text: date }) : null,
      uid ? el('span', { className: 'cn5ch-meta-uid notranslate', translate: 'no', text: uid }) : null
    ]);
  }

  // Themed tooltip for [data-cn5ch-tip] (el() turns `title` into it): native tooltips ignore the theme
  // and cannot carry romaji
  function mountTooltip() {
    if (document.getElementById('cn5ch-tip')) return;
    const { el, setText } = window.CN5CH.utils;
    const tip = el('div', { id: 'cn5ch-tip', className: 'cn5ch-injected', role: 'tooltip' });
    document.body.appendChild(tip);
    let current = null;

    const hide = () => {
      if (!current) return;
      current.removeAttribute('aria-describedby');
      current = null;
      tip.classList.remove('is-open');
    };

    const show = (target) => {
      current = target;
      setText(tip, target.dataset.cn5chTip);
      target.setAttribute('aria-describedby', 'cn5ch-tip');
      tip.classList.add('is-open');
      const pad = 8;
      const r = target.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(pad, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - pad);
      const top = r.top - t.height - 8 >= pad ? r.top - t.height - 8 : r.bottom + 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    const sync = (ev) => {
      const target = ev.target instanceof Element ? ev.target.closest('[data-cn5ch-tip]') : null;
      if (target === current) return;
      hide();
      if (target && document.documentElement.dataset.cn5chEnabled === '1') show(target);
    };

    document.addEventListener('pointerover', sync, { passive: true });
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide, { passive: true });
    window.addEventListener('scroll', hide, { passive: true });
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.components = {
    THEMES,
    mountTopbar,
    mountFloatingActions,
    mountTooltip,
    floorMeta,
    ensureLightbox,
    ensureQuotePopup
  };
})();
