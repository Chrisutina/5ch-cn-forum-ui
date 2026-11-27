(() => {
  'use strict';

  // Refined shadcn/ui & Linear muted pastel avatar tones (light/dark readable)
  const AVATAR_TONES = [
    { bg: '#EEF2FF', fg: '#4338CA' },
    { bg: '#E0F2FE', fg: '#0369A1' },
    { bg: '#ECFDF5', fg: '#047857' },
    { bg: '#F5F3FF', fg: '#6D28D9' },
    { bg: '#FFF1F2', fg: '#BE123C' },
    { bg: '#FFFBEB', fg: '#B45309' },
    { bg: '#F0FDFA', fg: '#0F766E' },
    { bg: '#EFF6FF', fg: '#1D4ED8' },
    { bg: '#FDF4FF', fg: '#A21CAF' },
    { bg: '#FFF7ED', fg: '#C2410C' }
  ];

  // Crisp Lucide-style SVG path definitions (shadcn/ui / Animate UI grammar)
  const ICON_PATHS = {
    search: [
      ['circle', { cx: '11', cy: '11', r: '7' }],
      ['path', { d: 'm20 20-3.5-3.5' }]
    ],
    reply: [
      ['polyline', { points: '9 14 4 9 9 4' }],
      ['path', { d: 'M20 20v-7a4 4 0 0 0-4-4H4' }]
    ],
    cornerDownRight: [
      ['polyline', { points: '15 10 20 15 15 20' }],
      ['path', { d: 'M4 4v7a4 4 0 0 0 4 4h12' }]
    ],
    copy: [
      ['rect', { width: '13', height: '13', x: '9', y: '9', rx: '2', ry: '2' }],
      ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]
    ],
    check: [
      ['polyline', { points: '20 6 9 17 4 12' }]
    ],
    arrowUpRight: [
      ['path', { d: 'M7 17 17 7' }],
      ['path', { d: 'M7 7h10v10' }]
    ],
    arrowRight: [
      ['path', { d: 'M5 12h14' }],
      ['path', { d: 'm12 5 7 7-7 7' }]
    ],
    arrowUp: [
      ['path', { d: 'm5 12 7-7 7 7' }],
      ['path', { d: 'M12 19V5' }]
    ],
    messageSquare: [
      ['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }]
    ],
    palette: [
      ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }],
      ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }],
      ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
      ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }],
      ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z' }]
    ],
    rotateCcw: [
      ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
      ['path', { d: 'M3 3v5h5' }]
    ],
    x: [
      ['path', { d: 'M18 6 6 18' }],
      ['path', { d: 'm6 6 12 12' }]
    ],
    chevronDown: [
      ['path', { d: 'm6 9 6 6 6-6' }]
    ],
    flame: [
      ['path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' }]
    ]
  };

  function svgIcon(name, size = 14) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.85');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const shapes = ICON_PATHS[name] || [];
    shapes.forEach(([tag, attrs]) => {
      const shape = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => shape.setAttribute(k, v));
      svg.appendChild(shape);
    });
    return svg;
  }

  // Plugin Chinese gets romaji ruby (src/romaji.js); anything else passes through untouched
  function rubify(text) {
    const romaji = window.CN5CH && window.CN5CH.romaji;
    return romaji ? romaji.rubify(text) : String(text);
  }

  // Replace a node's content; string parts are rubified one by one, so put 5ch text in its own part.
  // Several parts share one <span>: in a flex parent they would otherwise become separate items with gaps.
  function setText(node, ...parts) {
    const nodes = parts.map((p) => (p instanceof Node ? p : rubify(p)));
    node.replaceChildren(...(nodes.length > 1 ? [el('span', {}, nodes)] : nodes));
  }

  // text / string children are rubified; title becomes the themed tooltip (components.mountTooltip)
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, val]) => {
      if (val === undefined || val === null || val === false) return;
      if (key === 'className') {
        node.className = val;
      } else if (key === 'text') {
        node.append(rubify(val));
      } else if (key === 'title') {
        node.dataset.cn5chTip = String(val);
      } else if (key === 'dataset' && typeof val === 'object') {
        Object.entries(val).forEach(([dk, dv]) => {
          node.dataset[dk] = String(dv);
        });
      } else if (key.startsWith('on') && typeof val === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(node.style, val);
      } else if (val === true) {
        node.setAttribute(key, '');
      } else {
        node.setAttribute(key, String(val));
      }
    });

    const list = Array.isArray(children) ? children : [children];
    list.forEach((child) => {
      if (child === undefined || child === null || child === false) return;
      if (typeof child === 'string' || typeof child === 'number') {
        node.append(rubify(child));
      } else if (child instanceof Node) {
        node.appendChild(child);
      }
    });
    return node;
  }

  // <input> placeholders cannot hold <ruby>: overlay a rubified copy, anchored to the input (CSS anchor
  // positioning, so the input keeps its place in every flex row) and hidden once the input has text
  let placeholderSeq = 0;
  function rubyPlaceholders(root = document) {
    root.querySelectorAll('.cn5ch-injected input[placeholder]').forEach((input) => {
      const text = input.getAttribute('placeholder');
      const ruby = rubify(text);
      if (typeof ruby === 'string') return;
      const cs = getComputedStyle(input);
      const inset = (side) => `${parseFloat(cs[`padding${side}`]) + parseFloat(cs[`border${side}Width`])}px`;
      const anchor = `--cn5ch-ph-${(placeholderSeq += 1)}`;
      const overlay = el('span', { className: 'cn5ch-field-ph', 'aria-hidden': 'true' }, [ruby]);
      Object.assign(overlay.style, { positionAnchor: anchor, paddingLeft: inset('Left'), paddingRight: inset('Right'), fontSize: cs.fontSize });
      input.style.anchorName = anchor;
      if (!input.hasAttribute('aria-label')) input.setAttribute('aria-label', text);
      input.setAttribute('placeholder', ' ');
      input.after(overlay);
    });
  }

  function hashString(str) {
    let h = 2166136261;
    const text = String(str || 'anon');
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function avatarTone(seed) {
    return AVATAR_TONES[hashString(seed) % AVATAR_TONES.length];
  }

  function avatarColor(seed) {
    return avatarTone(seed).fg;
  }

  function avatarLabel(authorName, uid) {
    const cleanUid = String(uid || '').replace(/^ID:/i, '').replace(/\s*\[\d+\]$/, '').trim();
    const cleanName = String(authorName || '').trim();
    const isAnon = !cleanName || /名無し|風吹けば|以下、|番組の途中/.test(cleanName);
    if (isAnon && cleanUid && cleanUid !== '???') {
      return cleanUid.slice(0, 2).toUpperCase();
    }
    if (cleanName) {
      const firstChar = Array.from(cleanName.replace(/^[★☆◆◇\s]+/, ''))[0];
      if (firstChar) return firstChar.toUpperCase();
    }
    return '匿';
  }

  // Sliding indicator (thumb or underline) that follows the active item of a tab/segmented group
  function attachSlidingIndicator(containerEl, activeSelector = '.is-active') {
    if (!containerEl) return () => {};
    let indicator = containerEl.querySelector(':scope > .cn5ch-segmented-indicator');
    if (!indicator) {
      indicator = el('span', { className: 'cn5ch-segmented-indicator', 'aria-hidden': 'true' });
      containerEl.prepend(indicator);
    }

    const sync = () => {
      const active = containerEl.querySelector(activeSelector);
      if (!active) {
        indicator.style.opacity = '0';
        return;
      }
      indicator.style.opacity = '1';
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    };

    requestAnimationFrame(sync);
    // widths measured before web/system fonts settle are off by a few px
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    window.addEventListener('resize', sync, { passive: true });
    return sync;
  }

  function unwrapJumpUrl(rawHref) {
    if (!rawHref) return null;
    const match = String(rawHref).match(/^(?:https?:)?\/\/jump\.5ch\.(?:io|net)\/\?(.+)$/i);
    if (!match) return null;
    let target = match[1].trim();
    try {
      if (/^https?%3A/i.test(target)) {
        target = decodeURIComponent(target);
      }
    } catch {
      // Keep original target if malformed percent-encoding
    }
    if (/^https?:\/\//i.test(target)) {
      return target;
    }
    return null;
  }

  function unwrapLinksInContainer(container, enabled) {
    if (!enabled || !container) return;
    const links = container.querySelectorAll('a[href*="jump.5ch."]');
    links.forEach((a) => {
      if (a.dataset.cn5chUnwrapped === '1') return;
      const rawHref = a.getAttribute('href') || a.href;
      const direct = unwrapJumpUrl(rawHref);
      if (direct) {
        a.dataset.cn5chOrigHref = rawHref;
        a.setAttribute('href', direct);
        a.setAttribute('rel', 'noopener noreferrer nofollow');
        a.setAttribute('target', '_blank');
        a.dataset.cn5chUnwrapped = '1';
      }
    });
  }

  function isDirectImageUrl(url) {
    if (!url || !/^https?:\/\//i.test(url)) return false;
    try {
      const u = new URL(url);
      if (/img\.5ch\.(io|net)$/i.test(u.hostname) && u.pathname.startsWith('/ico/')) {
        return false;
      }
      if (/\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(u.pathname)) {
        return true;
      }
      if (/^pbs\.twimg\.com$/i.test(u.hostname) && u.pathname.startsWith('/media/')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function parseThreadLinkText(rawText) {
    const text = String(rawText || '').trim();
    let rest = text;
    let index = null;
    let count = null;

    const idxMatch = rest.match(/^(\d+)\s*[:：]\s*(.+)$/);
    if (idxMatch) {
      index = parseInt(idxMatch[1], 10);
      rest = idxMatch[2].trim();
    }

    const cntMatch = rest.match(/^(.*?)\s*\((\d+)\)\s*$/);
    if (cntMatch) {
      rest = cntMatch[1].trim();
      count = parseInt(cntMatch[2], 10);
    }

    return {
      index,
      title: rest || text,
      count
    };
  }

  function extractUidText(uidEl) {
    if (!uidEl) return '';
    const clone = uidEl.cloneNode(true);
    const countSpan = clone.querySelector('.uid-count');
    if (countSpan) countSpan.remove();
    return clone.textContent.trim();
  }

  function showToast(message) {
    let toast = document.getElementById('cn5ch-toast');
    if (!toast) {
      toast = el('div', { id: 'cn5ch-toast', className: 'cn5ch-injected' });
      document.body.appendChild(toast);
    }
    setText(toast, message);
    toast.classList.add('is-show');
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.remove('is-show');
    }, 1800);
  }

  function hideDynamicAds(root = document) {
    if (document.documentElement.dataset.cn5chAds !== '1') return;

    const adSelectors = [
      '.LEFT_AD',
      '#hidemetoo',
      '[id^="EOT-"]',
      '[id*="-INTERSTITIAL-"]',
      '[id*="-WIPE-"]',
      '.microad-overlay-footer',
      '#microad-overlay-footer',
      '[id*="microad"]',
      '[id*="browsi_adWrapper"]',
      'ins.adsbygoogle'
    ];
    root.querySelectorAll(adSelectors.join(',')).forEach((node) => {
      node.classList.add('cn5ch-ad-blocked');
    });

    const subjectRows = root.querySelectorAll('table#subjects tbody tr');
    subjectRows.forEach((tr) => {
      if (tr.classList.contains('cn5ch-ad-blocked')) return;
      const hasLink = tr.querySelector('td.subject-title a');
      const txt = (tr.textContent || '').trim();
      if (!hasLink && (txt.includes('広告') || tr.querySelector('iframe, ins, script'))) {
        tr.classList.add('cn5ch-ad-blocked');
      }
    });

    const feedItems = root.querySelectorAll('ul#thread_list_posts > li');
    feedItems.forEach((li) => {
      if (li.classList.contains('cn5ch-ad-blocked')) return;
      const hasThreadTitle = li.querySelector('.thread_title a');
      if (!hasThreadTitle && li.querySelector('iframe, ins, [id*="ad"], [class*="ad"]')) {
        li.classList.add('cn5ch-ad-blocked');
      }
    });
  }

  function startAdObserver() {
    hideDynamicAds(document);
    let timer = null;
    const observer = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        hideDynamicAds(document);
      }, 250);
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return observer;
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.utils = {
    el,
    rubify,
    setText,
    rubyPlaceholders,
    svgIcon,
    hashString,
    avatarTone,
    avatarColor,
    avatarLabel,
    attachSlidingIndicator,
    unwrapJumpUrl,
    unwrapLinksInContainer,
    isDirectImageUrl,
    parseThreadLinkText,
    extractUidText,
    showToast,
    hideDynamicAds,
    startAdObserver
  };
})();
