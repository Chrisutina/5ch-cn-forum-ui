# Chrome 应用商店上架资料

在 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 新建条目时逐项填写。名称和简介来自 `_locales/*/messages.json`（上传 zip 后自动读取，中文为默认语言，日文、英文为翻译），下面只列需要手动填的部分。

## 商店信息（Store listing）

- **类别（Category）**：Functionality & UI
- **语言（Language）**：中文（简体）；再为「日本語」「English」各加一份翻译，详细说明分别贴下面对应的版本
- **图标**：`icons/icon128.png`
- **屏幕截图**（1280×800）：`store/screenshot-1-thread-light.png` ~ `store/screenshot-4-categories.png`
- **小宣传图块**（440×280）：`store/promo-440x280.png`
- **官网 / 支持网址**：https://github.com/Chrisutina/5ch-cn-forum-ui

### 详细说明 · 中文

```
非官方扩展，与 5ch.io（5ちゃんねる）运营方无关。

把 5ch.io 全站 10 类页面改成按中文论坛习惯组织、精致极简的阅读界面。插件自己的中文界面上方都注有日文意思的罗马字，中国人看汉字，日本人看罗马字；5ch 自己的日文内容不加注。

【主要功能】
• 三套主题：极简白 / 羊皮纸 / 极简黑
• 帖子页：左侧楼层号行号栏；引用一行直达，悬停预览被引用的楼层；楼中楼原位展开；只看楼主、亮评、带图、只看某个 ID、楼内搜词
• 全站 10 类页面：首页、帖子、现代板块、旧版板块、subback、過去ログ、全站热榜、分类目录、全站板块导航、全站搜索
• 广告净化：隐藏侧栏、信息流和全屏插屏广告
• 外链直达：跳过 jump.5ch 中转页
• 图片：隐藏打码小方块，直接显示缩略图，点击看大图
• 按 / 聚焦全站搜索；顶栏「原版」按钮可临时切回 5ch 原样

广告净化、外链直达、图片和紧凑模式都可以在设置弹窗里单独关闭。

【隐私】
不收集、不上传任何数据，不含统计代码，也不加载远程代码；只在 5ch.io / 5ch.net 的页面上运行。

开源地址：https://github.com/Chrisutina/5ch-cn-forum-ui
```

### 詳細な説明 · 日本語

```
非公式の拡張機能です。5ch.io（5ちゃんねる）の運営とは関係ありません。

5ch.io の全 10 種類のページを、中国の掲示板風のすっきり読みやすいレイアウトに組み替えます。拡張機能の UI は中国語ですが、中国語のラベルにはすべて日本語の意味をローマ字で添えているので、中国語が読めなくても使えます。5ch の本文やスレタイなど日本語の部分には何も付けません。

【主な機能】
• 3 つのテーマ：ライト / 羊皮紙 / ダーク
• スレ画面：左側のレス番号欄、引用元へのジャンプとホバープレビュー、返信ツリーのその場展開、スレ主のみ・人気レス・画像付き・ID 絞り込み・スレ内検索
• 全 10 種類のページ：トップ、スレ、板（新 UI / 旧 UI）、subback、過去ログ、勢いランキング、カテゴリ一覧、全板一覧、検索
• 広告除去：サイド欄・フィード・全画面広告を非表示
• 外部リンク直通：jump.5ch を経由せずにリンク先を直接開く
• 画像：ぼかしの入った小さなサムネイルの代わりに画像を表示、クリックで拡大
• 「/」キーで全体検索、上部の「原版（orijinaru）」ボタンで元の 5ch 表示に一時的に戻せます

広告除去・外部リンク直通・画像・コンパクト表示は、設定でそれぞれオフにできます。

【プライバシー】
データの収集・送信は一切ありません。アクセス解析も外部コードの読み込みもなく、5ch.io / 5ch.net のページでのみ動作します。

ソースコード：https://github.com/Chrisutina/5ch-cn-forum-ui
```

### Detailed description · English

```
Unofficial extension — not affiliated with 5ch.io.

Restyles all 10 kinds of 5ch.io pages into a clean, Chinese-forum-style reading layout. The extension's own UI is in Chinese, and every Chinese label carries its Japanese meaning in romaji above it, so both Chinese and Japanese readers can use it. 5ch's own Japanese content is left untouched.

Features
• Three themes: light, parchment, dark
• Threads: floor-number gutter, one-line quote jumps with hover previews, inline reply trees, OP / popular / image / ID filters and in-thread search
• All 10 page types: home, threads, boards (new and old UI), subback, past logs, trending, categories, board directory, search
• Ad cleanup: hides sidebar, feed and full-screen ads
• Direct links: skips the jump.5ch redirect page
• Images: real thumbnails instead of blurred squares, click to enlarge
• Press / to search; the "原版" button temporarily shows the original 5ch layout

Ad cleanup, direct links, images and compact mode can each be turned off in the settings popup.

Privacy: no data is collected or sent, no analytics, no remote code. Runs only on 5ch.io / 5ch.net pages.

Source: https://github.com/Chrisutina/5ch-cn-forum-ui
```

## 隐私权（Privacy practices）

审核人员看英文最快，以下直接贴英文。

- **Single purpose**：
  `Restyles 5ch.io / 5ch.net pages into a cleaner, Chinese-forum-style reading layout (themes, thread navigation, ad cleanup), with Japanese romaji annotations on the extension's own Chinese UI.`
- **Permission justification · storage**：
  `Saves the user's settings (theme and feature toggles) locally in chrome.storage.local.`
- **Host permission justification**（内容脚本的匹配网址 `*://5ch.io/*`、`*://*.5ch.io/*`、`https://5ch.net/*`、`https://*.5ch.net/*`）：
  `The content scripts restyle 5ch pages. They only run on 5ch.io and 5ch.net and never on any other site.`
- **Remote code**：No, I am not using remote code.
- **Data usage**：所有数据类型都不勾；三条承诺（不出售或转让给第三方、不用于与单一用途无关的目的、不用于判断信用）全部勾选。
- **Privacy policy URL**：https://github.com/Chrisutina/5ch-cn-forum-ui/blob/main/PRIVACY.md

## 分发（Distribution）

- 免费；公开（Public）；所有地区。

## 上传的包

`dist/5ch-cn-forum-ui-<版本>.zip`，生成方法见 README「开发」一节（`git archive`，只含 manifest、_locales、src、styles、popup、icons）。每次更新先改 `manifest.json` 的 `version`，商店只接受更大的版本号。
