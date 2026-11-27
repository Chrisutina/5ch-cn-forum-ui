(() => {
  'use strict';

  const early = window.__CN5CH_EARLY__ || {};
  const CACHE_KEY = early.CACHE_KEY || '__cn5ch_settings_cache_v3';
  const VALID_THEMES = new Set(['shadcn', 'nga', 'dark']);
  const DEFAULTS = early.DEFAULTS || {
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

  const listeners = new Set();
  let currentSettings = loadFromLocalCache();

  function loadFromLocalCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveToLocalCache(settings) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore private browsing / storage limits
    }
  }

  function applySettingsToDom(settings) {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.cn5chEnabled = settings.enabled ? '1' : '0';
    root.dataset.cn5chTheme = normalizeTheme(settings.theme);
    root.dataset.cn5chAds = settings.blockAds ? '1' : '0';
    root.dataset.cn5chInlineImg = settings.inlineImages ? '1' : '0';
    root.dataset.cn5chCompact = settings.compactMode ? '1' : '0';
  }

  function notify(settings) {
    applySettingsToDom(settings);
    listeners.forEach((fn) => {
      try {
        fn(settings);
      } catch (err) {
        console.warn('[5ch-cn-ui] listener error:', err);
      }
    });
  }

  function getSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.get(DEFAULTS, (stored) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              resolve({ ...currentSettings });
              return;
            }
            currentSettings = { ...DEFAULTS, ...(stored || {}) };
            saveToLocalCache(currentSettings);
            applySettingsToDom(currentSettings);
            resolve({ ...currentSettings });
          });
          return;
        } catch {
          // Fall through to local cache
        }
      }
      applySettingsToDom(currentSettings);
      resolve({ ...currentSettings });
    });
  }

  function updateSettings(patch) {
    currentSettings = { ...currentSettings, ...patch };
    saveToLocalCache(currentSettings);
    notify(currentSettings);

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.set(currentSettings, () => resolve({ ...currentSettings }));
          return;
        } catch {
          // Fall through
        }
      }
      resolve({ ...currentSettings });
    });
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        const patch = {};
        let hasRelevant = false;
        Object.keys(DEFAULTS).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(changes, key)) {
            patch[key] = changes[key].newValue;
            hasRelevant = true;
          }
        });
        if (hasRelevant) {
          currentSettings = { ...currentSettings, ...patch };
          saveToLocalCache(currentSettings);
          notify(currentSettings);
        }
      });
    } catch {
      // Ignore outside extension context
    }
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.config = {
    DEFAULTS,
    get pageInfo() {
      return early.pageInfo || { type: 'generic', board: '', threadKey: '' };
    },
    get current() {
      return { ...currentSettings };
    },
    getSettings,
    updateSettings,
    subscribe,
    applySettingsToDom
  };
})();
