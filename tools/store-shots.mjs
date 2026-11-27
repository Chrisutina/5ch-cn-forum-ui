// Store / README images (dev only, not part of the extension): four 1280x800 screenshots of real 5ch pages
// and the 440x280 small promo tile, written to store/. Same Playwright setup as shoot.mjs.
//   node tools/store-shots.mjs
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'store');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || 'playwright-core');

// threads come from a calm board first: the news boards are mostly politics
const BOARDS = ['https://mevius.5ch.io/test/read.cgi/tech/', 'https://asahi.5ch.io/test/read.cgi/newsplus/'];

const ICON = `data:image/png;base64,${readFileSync(path.join(ROOT, 'icons', 'icon128.png')).toString('base64')}`;
const PROMO = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
html, body { margin: 0; width: 440px; height: 280px; overflow: hidden; }
body { position: relative; background: #0A0A0B; color: #EDEDEF;
  font-family: "Segoe UI Variable Text", "Segoe UI", "Noto Sans SC", "Microsoft YaHei UI", sans-serif; }
.glow { position: absolute; inset: 0;
  background: radial-gradient(280px 190px at 92% 112%, rgba(63, 185, 106, 0.30), transparent 70%),
              radial-gradient(220px 150px at -8% -22%, rgba(237, 237, 239, 0.09), transparent 70%); }
.wrap { position: absolute; inset: 0; padding: 28px 32px 24px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; align-items: center; gap: 12px; }
.top img { width: 40px; height: 40px; border-radius: 9px; }
.top span { font: 600 12.5px/1.2 "Segoe UI", sans-serif; color: #A8A8B0; letter-spacing: 0.02em; }
ruby { display: inline-grid; justify-items: center; vertical-align: baseline; baseline-source: last; }
rt { grid-row: 1; display: block; font: 500 11px/14px "Segoe UI", sans-serif; color: #8E8E98; letter-spacing: 0.02em; padding: 0 0.2em; }
h1 { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15; }
.chips { display: flex; gap: 8px; margin-top: 14px; }
.chip { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px 6px; border: 1px solid #2C2C31; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #D2D2D8; }
.chip i { width: 12px; height: 12px; border-radius: 50%; border: 1px solid #3E3E45; }
.chip rt { font-size: 9.5px; line-height: 12px; }
.foot { font: 500 11px/1.4 "Segoe UI", "Yu Gothic UI", sans-serif; color: #6A6A73; }
</style></head><body><div class="glow"></div><div class="wrap">
  <div class="top"><img src="${ICON}" alt=""><span>for 5ch.io · 非官方 · Unofficial</span></div>
  <div>
    <h1><ruby>中文论坛风<rt>chūka keijiban</rt></ruby> UI</h1>
    <div class="chips">
      <span class="chip"><i style="background:#FFFFFF"></i><ruby>极简白<rt>raito</rt></ruby></span>
      <span class="chip"><i style="background:#F7F0DF"></i><ruby>羊皮纸<rt>yōhishi</rt></ruby></span>
      <span class="chip"><i style="background:#0A0A0B"></i><ruby>极简黑<rt>dāku</rt></ruby></span>
    </div>
  </div>
  <div class="foot">日本語ローマ字つき · Chinese UI with Japanese romaji</div>
</div></body></html>`;

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(path.join(tmpdir(), 'cn5ch-store-'));
const ctx = await chromium.launchPersistentContext(profile, {
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 1280, height: 800 },
  locale: 'ja-JP',
  args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`]
});
const page = ctx.pages()[0] || (await ctx.newPage());
const visit = async (url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
};
const setTheme = async (id) => {
  await visit('https://5ch.io/');
  await page.evaluate((t) => document.querySelector(`.cn5ch-theme-btn[data-theme-id="${t}"]`)?.click(), id);
  await page.waitForTimeout(500);
};
const shot = (name) => page.screenshot({ path: path.join(OUT, name) });

try {
  let threadUrl = null;
  for (const board of BOARDS) {
    await visit(board);
    threadUrl = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table#subjects tbody tr'));
      const count = (tr) => parseInt((tr.querySelector('td.subject-count') || {}).textContent || '0', 10);
      const pick = rows.find((tr) => count(tr) >= 300 && count(tr) <= 900) || rows.find((tr) => count(tr) >= 150);
      const a = pick && pick.querySelector('td.subject-title a');
      return a ? a.href : null;
    });
    if (threadUrl) break;
  }
  if (!threadUrl) throw new Error('no thread with enough replies found');
  console.log('thread', threadUrl);

  await setTheme('shadcn');
  await visit(threadUrl);
  await shot('screenshot-1-thread-light.png');

  // dark: a floor with its 楼中楼 open and the hover preview of one reply
  await setTheme('dark');
  await visit(threadUrl);
  const chip = await page.evaluate(() => {
    const posts = Array.from(document.querySelectorAll('.post'));
    const n = (p) => p.querySelectorAll('.cn5ch-replies-bar .cn5ch-reply-chip.notranslate').length;
    const post = posts.find((p) => n(p) >= 2 && n(p) <= 4 && p.querySelector('.cn5ch-quote-card')) ||
      posts.find((p) => n(p) >= 2) || posts.find((p) => n(p) >= 1);
    if (!post) return null;
    const bar = post.querySelector('.cn5ch-replies-bar');
    window.scrollTo(0, bar.getBoundingClientRect().top + window.scrollY - 330);
    bar.querySelector('.cn5ch-reply-chip:not(.notranslate)').click();
    const r = bar.querySelector('.cn5ch-reply-chip.notranslate').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (chip) {
    await page.waitForTimeout(500);
    await page.mouse.move(chip.x, chip.y);
    await page.waitForTimeout(600);
  }
  await shot('screenshot-2-thread-dark.png');

  await setTheme('nga');
  await visit('https://5ch.io/');
  await shot('screenshot-3-home-parchment.png');

  await setTheme('shadcn');
  await visit('https://asahi.5ch.io/test/read.cgi/categories');
  await shot('screenshot-4-categories.png');

  const tile = await ctx.newPage();
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.setContent(PROMO);
  await tile.waitForTimeout(300);
  await tile.screenshot({ path: path.join(OUT, 'promo-440x280.png') });
} finally {
  await ctx.close();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chromium child processes may still hold the profile for a moment
  }
}
