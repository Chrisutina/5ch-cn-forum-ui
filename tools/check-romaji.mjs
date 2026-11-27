// Dev check (not loaded by the extension): every Chinese UI string in src/ and popup/ must be fully
// covered by the romaji dictionary in src/romaji.js, otherwise it renders without romaji.
//   node tools/check-romaji.mjs        exit 1 when something is not covered
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.runInNewContext(readFileSync(path.join(ROOT, 'src/romaji.js'), 'utf8'), ctx);
const { DICT, segment } = ctx.window.CN5CH.romaji;

// segmenter: longest match, all-or-nothing
assert.deepEqual([...segment('只看楼主')], ['只看楼主']);
assert.deepEqual([...segment('展开楼中楼')], ['展开楼中楼']);
assert.deepEqual([...segment('回复最多')], ['回复最多']);
assert.equal(segment('名無'), null); // 5ch's Japanese must stay untouched
assert.equal(segment('楼主様'), null);

// Japanese used in matching logic / regexes, and attribute-only text that never renders
const IGNORE = new Set(['名無', '風吹', '以下', '番組', '途中', '広告', '一覧', '過去', '匿']);
const SKIP_LINE = /aria-label|alt:|<title>/;
const HAN = /[㐀-鿿豈-﫿]+/g;

const files = [
  ...readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js')).map((f) => `src/${f}`),
  ...readdirSync(path.join(ROOT, 'src/pages')).map((f) => `src/pages/${f}`),
  'popup/popup.js',
  'popup/popup.html'
].filter((f) => f !== 'src/romaji.js');

const missing = [];
const used = new Set();
for (const f of files) {
  const src = readFileSync(path.join(ROOT, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ''));
  src.split('\n').forEach((line, i) => {
    const code = line.replace(/^\s*\/\/.*$/, '').replace(/\s\/\/\s.*$/, '');
    if (SKIP_LINE.test(code)) return;
    for (const [run] of code.matchAll(HAN)) {
      if (IGNORE.has(run)) continue;
      const words = segment(run);
      if (words) words.forEach((w) => used.add(w));
      else missing.push(`${f}:${i + 1}  ${run}`);
    }
  });
}

const unused = [...DICT.keys()].filter((k) => !used.has(k));
if (unused.length) console.log(`unused dictionary keys (${unused.length}): ${unused.join(' ')}`);
if (missing.length) {
  console.log(`not covered by src/romaji.js (${missing.length}):`);
  missing.forEach((m) => console.log(`  ${m}`));
  process.exitCode = 1;
} else {
  console.log(`romaji: ${used.size} dictionary words cover every Chinese UI string in ${files.length} files`);
}
