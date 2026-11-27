(() => {
  'use strict';

  const SUPPORTED_PAGES = new Set([
    'home',
    'discovery',
    'thread',
    'board-modern',
    'board-legacy',
    'subback',
    'kako',
    'categories',
    'directory',
    'search'
  ]);

  // First-screen entrance: the first 8 list items fade in once on load; nothing animates while reading/scrolling.
  const ENTER_ITEMS = [
    '.post',
    'ul#thread_list_posts > li.thread',
    'table#subjects tbody tr',
    'ol#discovery-threads > li',
    '.cn5ch-thread-row',
    'details.category-group',
    '.cn5ch-dir-card',
    '.list_line'
  ].join(', ');

  function markEntrance() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    Array.from(document.querySelectorAll(ENTER_ITEMS))
      .slice(0, 8)
      .forEach((node, i) => {
        node.style.setProperty('--cn5ch-i', String(i));
        node.classList.add('cn5ch-enter');
        // drop the class afterwards, otherwise a later animation swap (jump flash) would replay the entrance
        node.addEventListener('animationend', () => node.classList.remove('cn5ch-enter'), { once: true });
      });
  }

  async function bootstrap() {
    if (!window.CN5CH || !window.CN5CH.config || !window.CN5CH.utils || !window.CN5CH.components) {
      return;
    }

    const { config, utils, components, pages } = window.CN5CH;
    const settings = await config.getSettings();
    const pageInfo = config.pageInfo;

    // Never interfere with login, CGI confirmation, or unknown pages
    if (!SUPPORTED_PAGES.has(pageInfo.type)) {
      return;
    }

    const onUpdateSettings = (patch) => config.updateSettings(patch);

    let initialized = false;

    function runTransform(activeSettings) {
      if (!activeSettings.enabled) {
        document.body.classList.remove('cn5ch-has-topbar');
        return;
      }

      document.body.classList.add('cn5ch-has-topbar');

      if (!initialized) {
        initialized = true;
        components.mountTopbar(activeSettings, pageInfo, onUpdateSettings);
        components.mountFloatingActions(pageInfo, onUpdateSettings);
        components.mountTooltip();
        utils.startAdObserver();

        const handler = pages && pages[pageInfo.type];
        if (typeof handler === 'function') {
          try {
            handler(activeSettings, pageInfo);
          } catch (err) {
            console.error('[5ch-cn-ui] transform error:', pageInfo.type, err);
          }
        }
        utils.rubyPlaceholders();
        markEntrance();
      } else {
        utils.hideDynamicAds(document);
      }
    }

    runTransform(settings);

    config.subscribe((next) => {
      runTransform(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
