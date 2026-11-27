(() => {
  'use strict';

  const POPULAR_BOARDS = [
    { name: '新闻速报+', url: 'https://asahi.5ch.io/test/read.cgi/newsplus' },
    { name: '新闻速报', url: 'https://hayabusa9.5ch.io/test/read.cgi/news' },
    { name: '实况 G', url: 'https://nova.5ch.io/test/read.cgi/livegalileo' },
    { name: '嫌储', url: 'https://greta.5ch.io/test/read.cgi/poverty' },
    { name: '编程开发', url: 'https://mevius.5ch.io/test/read.cgi/tech' },
    { name: '科学新闻+', url: 'https://egg.5ch.io/test/read.cgi/scienceplus' },
    { name: '艺能体育+', url: 'https://hayabusa9.5ch.io/test/read.cgi/mnewsplus' },
    { name: 'PC 硬件', url: 'https://egg.5ch.io/test/read.cgi/jisaku' }
  ];

  function enhanceFeedItem(li, settings) {
    if (!li || li.dataset.cn5chEnhanced === '1') return;
    const { el, svgIcon, unwrapLinksInContainer } = window.CN5CH.utils;

    const titleLink = li.querySelector('.thread_title a');
    if (!titleLink || li.classList.contains('ads_conten_main') || !li.classList.contains('thread')) {
      li.classList.add('cn5ch-ad-blocked');
      return;
    }

    li.dataset.cn5chEnhanced = '1';
    unwrapLinksInContainer(li, settings.unwrapJumpLinks);

    let commentCount = 0;
    let powerVal = 0;

    li.querySelectorAll('.thread_detail_child').forEach((child) => {
      const titleAttr = child.getAttribute('title') || '';
      const valEl = child.querySelector('.thread_detail_child_value');
      const boardLink = child.querySelector('a[href*=".5ch."]');

      if (titleAttr === 'Comment' && valEl) {
        commentCount = parseInt(valEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
        const link = child.querySelector('a');
        const href = link ? link.href : titleLink.href;
        child.replaceChildren(
          el('a', { className: 'cn5ch-stat-pill notranslate', translate: 'no', href }, [
            svgIcon('messageSquare', 12),
            `${commentCount} 回复`
          ])
        );
      } else if (titleAttr === 'パワ' && valEl) {
        powerVal = parseInt(valEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
        child.replaceChildren(
          el('span', { className: 'cn5ch-stat-pill is-power notranslate', translate: 'no' }, [
            svgIcon('flame', 12),
            `${powerVal} 热度`
          ])
        );
      } else if (boardLink && !child.querySelector('.thread_detail_child_value')) {
        boardLink.classList.add('cn5ch-badge', 'cn5ch-badge-board');
      }
    });

    li.dataset.cn5chComments = String(commentCount);
    li.dataset.cn5chPower = String(powerVal);

    if (commentCount >= 200 || powerVal >= 1000) {
      const titleBox = li.querySelector('.thread_title');
      if (titleBox && !titleBox.querySelector('.cn5ch-badge-hot')) {
        titleBox.prepend(
          el(
            'span',
            { className: 'cn5ch-badge cn5ch-badge-hot notranslate', translate: 'no' },
            [svgIcon('flame', 11), '热议']
          )
        );
      }
    }
  }

  function transformHome(settings) {
    const { el, svgIcon, attachSlidingIndicator } = window.CN5CH.utils;
    const feedList = document.querySelector('ul#thread_list_posts');
    const mainCol = feedList ? feedList.closest('.col-lg-6') : document.querySelector('#main-content-box .col-lg-6');
    const row = mainCol ? mainCol.parentElement : null;

    if (!feedList || !mainCol || !row) return;

    const processAll = () => {
      feedList.querySelectorAll(':scope > li').forEach((li) => enhanceFeedItem(li, settings));
    };
    processAll();

    // High-contrast sliding pill filter bar
    if (!mainCol.querySelector('.cn5ch-home-filter-bar')) {
      let currentMode = 'all';
      let keyword = '';
      let syncSlider = () => {};

      const applyFilter = () => {
        const q = keyword.trim().toLowerCase();
        feedList.querySelectorAll(':scope > li.thread').forEach((li) => {
          if (li.classList.contains('cn5ch-ad-blocked')) return;
          const comments = parseInt(li.dataset.cn5chComments || '0', 10);
          const power = parseInt(li.dataset.cn5chPower || '0', 10);
          const text = (li.textContent || '').toLowerCase();

          let visible = true;
          if (currentMode === 'hot' && comments < 100 && power < 800) {
            visible = false;
          }
          if (visible && q && !text.includes(q)) {
            visible = false;
          }
          li.style.display = visible ? '' : 'none';
        });
        requestAnimationFrame(syncSlider);
      };

      const btnAll = el('button', {
        type: 'button',
        className: 'cn5ch-tab-pill is-active',
        text: '全部动态',
        onClick: () => {
          currentMode = 'all';
          btnAll.classList.add('is-active');
          btnHot.classList.remove('is-active');
          applyFilter();
        }
      });

      const btnHot = el(
        'button',
        {
          type: 'button',
          className: 'cn5ch-tab-pill',
          onClick: () => {
            currentMode = 'hot';
            btnHot.classList.add('is-active');
            btnAll.classList.remove('is-active');
            applyFilter();
          }
        },
        [svgIcon('flame', 13), '热门高楼']
      );

      const tabGroup = el('div', { className: 'cn5ch-tab-group', role: 'tablist' }, [btnAll, btnHot]);

      const quickInput = el('input', {
        type: 'search',
        placeholder: '筛选本页帖子…',
        onInput: (ev) => {
          keyword = ev.target.value || '';
          applyFilter();
        }
      });

      const filterBar = el('div', { className: 'cn5ch-card cn5ch-home-filter-bar cn5ch-injected' }, [
        el('div', { className: 'cn5ch-home-filter-tabs' }, [
          el('strong', { className: 'cn5ch-home-title', text: '社区热帖广场' }),
          tabGroup
        ]),
        quickInput
      ]);

      mainCol.prepend(filterBar);
      syncSlider = attachSlidingIndicator(tabGroup, '.cn5ch-tab-pill.is-active');
    }

    // High-contrast right sidebar
    if (!row.querySelector('.cn5ch-home-sidebar')) {
      const discovered = new Map();
      feedList.querySelectorAll('.thread_detail a[href*=".5ch."]').forEach((a) => {
        const label = (a.textContent || '').trim();
        const href = a.href;
        if (label && href && !href.includes('/test/read.cgi/') && !discovered.has(href)) {
          discovered.set(href, label);
        }
      });

      const popularSlugs = new Set(
        POPULAR_BOARDS.map((b) => {
          const m = b.url.match(/\/([^/]+)\/?$/);
          return m ? m[1].toLowerCase() : '';
        })
      );

      const boardChips = [];
      POPULAR_BOARDS.forEach((b) => {
        boardChips.push(el('a', { className: 'cn5ch-board-chip', href: b.url, text: b.name }));
      });
      Array.from(discovered.entries())
        .slice(0, 8)
        .forEach(([href, name]) => {
          const m = href.match(/\.5ch\.(?:io|net)\/([^/]+)\/?$/i);
          const slug = m ? m[1].toLowerCase() : '';
          if (slug && popularSlugs.has(slug)) return;
          boardChips.push(el('a', { className: 'cn5ch-board-chip', href, text: name }));
        });

      const sidebar = el('aside', { className: 'cn5ch-home-sidebar cn5ch-injected' }, [
        el('div', { className: 'cn5ch-card cn5ch-side-card' }, [
          el('div', { className: 'cn5ch-side-title' }, [
            el('span', { text: '热门板块直达' }),
            el('a', { href: 'https://asahi.5ch.io/test/read.cgi/categories' }, ['全部分区', svgIcon('arrowRight', 12)])
          ]),
          el('div', { className: 'cn5ch-board-chips' }, boardChips)
        ]),
        el('div', { className: 'cn5ch-card cn5ch-side-card' }, [
          el('div', { className: 'cn5ch-side-title' }, [
            el('span', { text: '全站实时榜单' }),
            el('a', { href: 'https://asahi.5ch.io/test/read.cgi/' }, ['进入热榜', svgIcon('arrowRight', 12)])
          ]),
          el('p', {
            className: 'cn5ch-side-note',
            text: '「/」键：搜索全站帖子。帖子页：引用直达、楼中楼、只看楼主、看大图。'
          })
        ])
      ]);

      row.appendChild(sidebar);
    }

    const obs = new MutationObserver(() => processAll());
    obs.observe(feedList, { childList: true });
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.pages = window.CN5CH.pages || {};
  window.CN5CH.pages.home = transformHome;
})();
