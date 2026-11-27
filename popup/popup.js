(() => {
  'use strict';

  const VALID_THEMES = new Set(['shadcn', 'nga', 'dark']);
  const DEFAULTS = {
    enabled: true,
    theme: 'shadcn',
    blockAds: true,
    unwrapJumpLinks: true,
    inlineImages: true,
    compactMode: false
  };

  const checkboxIds = ['enabled', 'blockAds', 'unwrapJumpLinks', 'inlineImages', 'compactMode'];
  const statusMsg = document.getElementById('status-msg');
  const themeCards = Array.from(document.querySelectorAll('.theme-card'));

  const { rubify, annotateTree } = window.CN5CH.romaji;

  function flashStatus(text) {
    if (!statusMsg) return;
    statusMsg.replaceChildren(rubify(text));
    clearTimeout(statusMsg.__timer);
    statusMsg.__timer = setTimeout(() => {
      statusMsg.replaceChildren(rubify('实时生效'));
    }, 1400);
  }

  function renderState(state) {
    const theme = VALID_THEMES.has(state.theme) ? state.theme : 'shadcn';
    checkboxIds.forEach((key) => {
      const input = document.getElementById(`opt-${key}`);
      if (input) input.checked = Boolean(state[key]);
    });
    themeCards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.theme === theme);
    });
  }

  function savePatch(patch) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(patch, () => {
        flashStatus('已保存');
      });
    } else {
      flashStatus('预览模式');
    }
  }

  function init() {
    annotateTree(document.body);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULTS, (stored) => {
        renderState({ ...DEFAULTS, ...(stored || {}) });
      });
    } else {
      renderState(DEFAULTS);
    }

    checkboxIds.forEach((key) => {
      const input = document.getElementById(`opt-${key}`);
      if (!input) return;
      input.addEventListener('change', () => {
        savePatch({ [key]: input.checked });
      });
    });

    themeCards.forEach((card) => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        themeCards.forEach((c) => c.classList.toggle('is-active', c === card));
        savePatch({ theme });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
