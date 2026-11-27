(() => {
  'use strict';

  const CACHE_KEY = '__cn5ch_settings_cache_v3';
  const VALID_THEMES = new Set(['shadcn', 'nga', 'dark']);
  const DEFAULTS = {
    enabled: true,
    theme: 'shadcn',
    blockAds: true,
    unwrapJumpLinks: true,
    inlineImages: true,
    compactMode: false
  };

  function normalizeTheme(theme) {
    return VALID_THEMES.has(theme) ? theme : 'shadcn';
  }

  function detectPageType(loc) {
    const host = (loc.hostname || '').toLowerCase();
    const path = loc.pathname || '/';

    if (host === '5ch.io' || host === 'www.5ch.io' || host === '5ch.net' || host === 'www.5ch.net') {
      if (path === '/' || path === '' || path === '/index.html') {
        return { type: 'home', board: '', threadKey: '' };
      }
      return { type: 'generic', board: '', threadKey: '' };
    }

    if (host === 'find.5ch.io' || host === 'find.5ch.net') {
      return { type: 'search', board: '', threadKey: '' };
    }

    if (
      host === 'menu.5ch.io' ||
      host === 'menu.5ch.net' ||
      ((host === 'www2.5ch.io' || host === 'www2.5ch.net') &&
        (path === '/' || /^\/5ch\.html$/i.test(path) || /^\/bbstable\.html$/i.test(path)))
    ) {
      return { type: 'directory', board: '', threadKey: '' };
    }

    if (/^\/test\/bbs\.cgi/i.test(path)) {
      return { type: 'generic', board: '', threadKey: '' };
    }

    if (/^\/test\/read\.cgi\/categories\/?$/i.test(path)) {
      return { type: 'categories', board: '', threadKey: '' };
    }

    const threadMatch = path.match(/^\/test\/read\.cgi\/([^/]+)\/(\d{6,})(?:\/.*)?$/i);
    if (threadMatch) {
      return { type: 'thread', board: threadMatch[1], threadKey: threadMatch[2] };
    }

    const modernBoardMatch = path.match(/^\/test\/read\.cgi\/([^/]+)\/?$/i);
    if (modernBoardMatch && modernBoardMatch[1] !== '_assets') {
      return { type: 'board-modern', board: modernBoardMatch[1], threadKey: '' };
    }

    if (/^\/test\/read\.cgi\/?$/i.test(path)) {
      return { type: 'discovery', board: '', threadKey: '' };
    }

    const kakoMatch = path.match(/^\/([^/]+)\/kako(?:\/.*)?$/i);
    if (kakoMatch) {
      return { type: 'kako', board: kakoMatch[1], threadKey: '' };
    }

    if (host === 'kako.5ch.io' || host === 'kako.5ch.net') {
      return { type: 'directory', board: '', threadKey: '' };
    }

    const subbackMatch = path.match(/^\/([^/]+)\/subback\.html$/i);
    if (subbackMatch) {
      return { type: 'subback', board: subbackMatch[1], threadKey: '' };
    }

    const reservedHosts = /^(www2|find|menu|jump|img|be|headline|stat|info|egg-info)\./i;
    const legacyBoardMatch = path.match(/^\/([a-z0-9_-]+)\/(?:index\.html)?$/i);
    if (legacyBoardMatch && !reservedHosts.test(host) && legacyBoardMatch[1] !== 'test') {
      return { type: 'board-legacy', board: legacyBoardMatch[1], threadKey: '' };
    }

    return { type: 'generic', board: '', threadKey: '' };
  }

  function readCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function applyRootAttributes(settings, pageInfo) {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.cn5chEnabled = settings.enabled ? '1' : '0';
    root.dataset.cn5chTheme = normalizeTheme(settings.theme);
    root.dataset.cn5chAds = settings.blockAds ? '1' : '0';
    root.dataset.cn5chInlineImg = settings.inlineImages ? '1' : '0';
    root.dataset.cn5chCompact = settings.compactMode ? '1' : '0';
    root.dataset.cn5chPage = pageInfo.type;
    if (pageInfo.board) {
      root.dataset.cn5chBoard = pageInfo.board;
    }
  }

  const pageInfo = detectPageType(window.location);
  const cached = readCache();
  applyRootAttributes(cached, pageInfo);

  window.__CN5CH_EARLY__ = {
    CACHE_KEY,
    DEFAULTS,
    pageInfo,
    detectPageType,
    applyRootAttributes
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      chrome.storage.local.get(DEFAULTS, (stored) => {
        if (chrome.runtime && chrome.runtime.lastError) return;
        const merged = { ...DEFAULTS, ...(stored || {}) };
        applyRootAttributes(merged, pageInfo);
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        } catch {
          // Ignore storage quota / private mode restrictions
        }
      });
    } catch {
      // Ignore if running outside extension runtime (e.g. test harness)
    }
  }
})();
