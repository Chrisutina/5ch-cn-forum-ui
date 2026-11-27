// Acceptance harness (dev only, not loaded by the extension).
// Loads this unpacked extension into Playwright's Chromium (branded Chrome/Edge no longer accept
// --load-extension), visits real 5ch pages, saves screenshots and runs layout checks.
// Exit code 1 when any check fails.
//
//   node tools/shoot.mjs [--themes shadcn,nga,dark] [--widths 1440] [--pages thread,home]
//                        [--out tools/shots] [--dark-scheme] [--disabled]
//
// Needs playwright-core plus its Chromium (`npm i --no-save playwright-core && npx playwright install chromium`).
// PW_CORE points at a playwright-core install elsewhere; PW_CHROME at a specific Chromium binary.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PW_CORE = process.env.PW_CORE || 'playwright-core';
// extensions need full Chromium in new headless mode; Playwright's default headless shell cannot load them
const BROWSER = process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : { channel: 'chromium' };

const { values: opt } = parseArgs({
  options: {
    themes: { type: 'string', default: 'shadcn' },
    widths: { type: 'string', default: '1440' },
    pages: { type: 'string', default: '' },
    out: { type: 'string', default: path.join(ROOT, 'tools', 'shots') },
    'dark-scheme': { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false }
  }
});

const PAGES = {
  home: 'https://5ch.io/',
  'board-modern': 'https://asahi.5ch.io/test/read.cgi/newsplus/',
  thread: null, // picked from the board-modern list
  'board-legacy': 'https://asahi.5ch.io/newsplus/',
  subback: 'https://asahi.5ch.io/newsplus/subback.html',
  discovery: 'https://asahi.5ch.io/test/read.cgi/',
  categories: 'https://asahi.5ch.io/test/read.cgi/categories',
  directory: 'https://www2.5ch.io/5ch.html',
  search: 'https://find.5ch.io/search?q=AI',
  kako: 'https://asahi.5ch.io/newsplus/kako/'
};
const wanted = opt.pages ? opt.pages.split(',') : Object.keys(PAGES);
const ADS = ['a[href*="uplift.5ch"]', '.navmenu .uploadlink'];

// Per-page checks; each returns { ok, detail }. Runs inside the page.
function runChecks({ page, disabled, ads }) {
  const results = [];
  const add = (name, ok, detail = '') => results.push({ name, ok, detail });
  const visible = (n) => {
    if (!n) return false;
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const rect = (s) => {
    const n = document.querySelector(s);
    return n ? n.getBoundingClientRect() : null;
  };
  const edges = (sels) => {
    const rs = sels.map(rect);
    const missing = sels.filter((_, i) => !rs[i]);
    if (missing.length) return add(`edges(${sels.join(' | ')})`, false, `missing ${missing.join(', ')}`);
    const L = rs.map((r) => Math.round(r.left));
    const R = rs.map((r) => Math.round(r.right));
    const ok = Math.max(...L) - Math.min(...L) <= 1 && Math.max(...R) - Math.min(...R) <= 1;
    add(`edges(${sels.join(' | ')})`, ok, `L ${L.join('/')} R ${R.join('/')}`);
  };
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const effectiveBg = (n) => {
    const layers = [];
    for (let e = n; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255 };
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      const c = layers[i];
      base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) };
    }
    return base;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (sel, min, pseudo = null) => {
    const n = document.querySelector(sel);
    const name = `contrast(${sel}${pseudo || ''}) >= ${min}`;
    if (!n) return add(name, false, 'missing');
    const fg = parse(getComputedStyle(n, pseudo).color);
    const bg = effectiveBg(n);
    const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (hi + 0.05) / (lo + 0.05);
    add(name, ratio >= min, ratio.toFixed(2));
  };

  const root = document.documentElement;
  if (disabled) {
    add('disabled: topbar hidden', !visible(document.getElementById('cn5ch-topbar')));
    if (page === 'thread') {
      const post = document.querySelector('.post');
      const content = post ? getComputedStyle(post, '::before').content : 'missing';
      add('disabled: no floor-number gutter', Boolean(post) && !content.includes('attr('), content);
    }
    return results;
  }

  add('noOverflow', root.scrollWidth <= root.clientWidth + 1, `${root.scrollWidth} vs ${root.clientWidth}`);

  const bar = rect('#cn5ch-topbar .cn5ch-topbar-inner');
  const form = rect('.cn5ch-top-search');
  if (bar && form) {
    const off = form.top - bar.top - (bar.height - form.height) / 2;
    add('topbarCentered', Math.abs(off) <= 1, `offset ${off.toFixed(1)}px`);
  } else {
    add('topbarCentered', false, 'topbar missing');
  }

  for (const s of ['.cn5ch-top-search input', '.cn5ch-theme-btn']) {
    const n = document.querySelector(s);
    const ff = n ? getComputedStyle(n).fontFamily : '';
    add(`controlsFont(${s})`, Boolean(n) && !/^"?Arial/i.test(ff), ff.slice(0, 40));
  }

  const shownAds = ads.filter((s) => Array.from(document.querySelectorAll(s)).some(visible));
  add('adsHidden', shownAds.length === 0, shownAds.join(', '));

  // romaji above the plugin's Chinese: present, inside the viewport, not cut by an overflow ancestor
  const rts = Array.from(document.querySelectorAll('.cn5ch-romaji rt')).filter(visible);
  const cut = [];
  rts.forEach((rt) => {
    const r = rt.getBoundingClientRect();
    if (r.left < -1 || r.right > root.clientWidth + 1) return cut.push(`${rt.textContent}(viewport)`);
    for (let a = rt.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const ar = a.getBoundingClientRect();
      const outX = cs.overflowX !== 'visible' && (r.left < ar.left - 1 || r.right > ar.right + 1);
      const outY = cs.overflowY !== 'visible' && (r.top < ar.top - 1 || r.bottom > ar.bottom + 1);
      if (outX || outY) return cut.push(`${rt.textContent}(${a.className || a.tagName})`);
    }
    return null;
  });
  add('romaji present, not clipped', rts.length > 0 && cut.length === 0, `${rts.length} rt${cut.length ? `; clipped: ${cut.slice(0, 4).join(', ')}` : ''}`);

  if (page === 'thread') {
    const n = document.querySelector('.post .post-content');
    const ff = n ? getComputedStyle(n).fontFamily : '';
    const at = (name) => {
      const i = ff.indexOf(name);
      return i < 0 ? Infinity : i;
    };
    add('fontJP(.post-content)', at('Yu Gothic') < Math.min(at('YaHei'), at('Noto Sans SC')), ff.slice(0, 90));
    edges(['h1#threadtitle', '.cn5ch-thread-toolbar', '.post']);
    contrast('.post .post-content', 4.5);
    contrast('.post .cn5ch-author-line2', 4.5);
    // hover preview clones .post-content out of .post: 5ch's own `.post-content { color: var(--fg) }` used to win there
    const chip = document.querySelector('.cn5ch-replies-bar .cn5ch-reply-chip.notranslate');
    if (chip) {
      chip.dispatchEvent(new MouseEvent('mouseenter'));
      contrast('#cn5ch-quote-popup .cn5ch-quote-popup-body .post-content', 4.5);
      // close it without the fade, or the screenshot taken right after catches it half transparent
      const pop = document.getElementById('cn5ch-quote-popup');
      pop.style.transition = 'none';
      pop.classList.remove('is-open');
      void pop.offsetWidth;
      pop.style.transition = '';
    } else {
      add('quote popup contrast', false, 'no reply chip on this page');
    }
    contrast('.post:not(.cn5ch-is-op)', 3, '::before');
    // floor number is pinned, not grid-placed (grid placement misplaced it when 5ch mutated floors)
    const post = document.querySelector('.post');
    const pcs = post && getComputedStyle(post);
    const bcs = post && getComputedStyle(post, '::before');
    add('floor number pinned (block floor, absolute ::before)', Boolean(post) && pcs.display !== 'grid' && bcs.position === 'absolute', post ? `${pcs.display} / ${bcs.position}` : 'missing');
  }
  if (page === 'home') {
    edges(['.cn5ch-home-filter-bar', 'ul#thread_list_posts']);
    contrast('.thread_detail .cn5ch-stat-pill', 4.5);
  }
  if (page === 'board-modern') {
    edges(['main#threadcontent > h1', '.board-tools', 'table#subjects']);
    contrast('table#subjects tbody td.subject-created', 4.5);
  }
  if (page === 'discovery') {
    const h1 = rect('main#threadcontent > h1');
    add('discovery h1 width >= 200', Boolean(h1) && h1.width >= 200, h1 ? `${Math.round(h1.width)}px` : 'missing');
    edges(['main#threadcontent > h1', 'ol#discovery-threads']);
  }
  // categories / directory: sections on the left, a visible sticky index on the right
  const catLayout = (main) => {
    const layout = document.querySelector('.cn5ch-cat-layout');
    const index = document.querySelector('.cn5ch-cat-index');
    const m = document.querySelector(main);
    // ≤900px the design drops the index and goes single-column
    const narrow = root.clientWidth <= 900;
    const ok = Boolean(layout && index && m) && (narrow
      ? !visible(index)
      : visible(index) && index.getBoundingClientRect().left > m.getBoundingClientRect().right);
    add('category layout: sections + right index', ok, layout ? `index ${index ? Math.round(index.getBoundingClientRect().left) : '-'} vs main right ${m ? Math.round(m.getBoundingClientRect().right) : '-'}` : 'no .cn5ch-cat-layout');
  };
  if (page === 'categories') catLayout('.category-columns');
  if (page === 'directory') catLayout('.cn5ch-dir-grid');
  if (page === 'search') edges(['.row.searchbar', '.list']);
  if (page === 'kako') {
    const shell = document.getElementById('cn5ch-kako-shell');
    add('kako shell is block', Boolean(shell) && getComputedStyle(shell).display === 'block', shell ? getComputedStyle(shell).display : 'missing');
    edges(['.cn5ch-board-hero', '.cn5ch-kako-layout']);
  }
  return results;
}

mkdirSync(opt.out, { recursive: true });
const profile = mkdtempSync(path.join(tmpdir(), 'cn5ch-prof-'));
const require = createRequire(import.meta.url);
const { chromium } = require(PW_CORE);
const report = [];
let failures = 0;

try {
  for (const width of opt.widths.split(',').map(Number)) {
    const ctx = await chromium.launchPersistentContext(profile, {
      ...BROWSER,
      headless: true,
      viewport: { width, height: 900 },
      locale: 'ja-JP',
      colorScheme: opt['dark-scheme'] ? 'dark' : 'light',
      args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`]
    });
    const page = ctx.pages()[0] || (await ctx.newPage());
    const visit = async (url) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => console.log(`  goto: ${e.message.split('\n')[0]}`));
      await page.waitForTimeout(2500);
    };

    let threadUrl = null;
    for (const theme of opt.themes.split(',')) {
      // set the theme on a throwaway visit so the toast does not land in the screenshots
      await visit(PAGES.home);
      await page.evaluate((t) => {
        const b = document.querySelector(`.cn5ch-theme-btn[data-theme-id="${t}"]`);
        if (b && !b.classList.contains('is-active')) b.click();
      }, theme);
      await page.waitForTimeout(400);

      for (const name of Object.keys(PAGES)) {
        if (!wanted.includes(name)) continue;
        if (name === 'thread' && !threadUrl) {
          await visit(PAGES['board-modern']);
          threadUrl = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table#subjects tbody tr'));
            const pick = rows.find((tr) => {
              const n = parseInt((tr.querySelector('td.subject-count') || {}).textContent || '0', 10);
              return n >= 100 && n <= 500;
            }) || rows.find((tr) => tr.querySelector('td.subject-title a'));
            const a = pick && pick.querySelector('td.subject-title a');
            return a ? a.href : null;
          });
          if (!threadUrl) {
            console.log('thread: no thread link found');
            failures += 1;
            continue;
          }
        }
        const url = name === 'thread' ? threadUrl : PAGES[name];
        await visit(url);
        if (opt.disabled) {
          await page.evaluate(() => {
            const b = document.querySelector('.cn5ch-toggle-origin-btn');
            if (b) b.click();
          });
          await page.waitForTimeout(600);
        }
        const results = await page.evaluate(runChecks, { page: name, disabled: opt.disabled, ads: ADS });
        const tag = `${theme}-${width}-${name}${opt.disabled ? '-disabled' : ''}${opt['dark-scheme'] ? '-darkscheme' : ''}`;
        await page.screenshot({ path: path.join(opt.out, `${tag}.png`) });
        if (name === 'thread' && !opt.disabled) {
          // second shot: a floor that quotes another floor, so quote line and footer are visible
          await page.evaluate(() => {
            const posts = Array.from(document.querySelectorAll('.post'));
            const p = posts.find((x) => x.querySelector('.cn5ch-quote-card') && x.querySelector('.cn5ch-reply-chip')) ||
              posts.find((x) => x.querySelector('.cn5ch-quote-card')) || posts[2];
            if (p) window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 120);
          });
          await page.waitForTimeout(400);
          await page.screenshot({ path: path.join(opt.out, `${tag}-floors.png`) });
        }
        const bad = results.filter((r) => !r.ok);
        failures += bad.length;
        report.push({ tag, url, results });
        console.log(`${bad.length ? 'FAIL' : 'pass'}  ${tag}`);
        bad.forEach((r) => console.log(`      x ${r.name}  ${r.detail}`));
      }
      if (opt.disabled) break; // one theme is enough for the disabled pass
    }
    await ctx.close();
  }
} finally {
  writeFileSync(path.join(opt.out, 'report.json'), JSON.stringify(report, null, 2));
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chromium child processes may still hold the profile for a moment
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exitCode = failures ? 1 : 0;
