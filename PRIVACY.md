# 隐私政策 / プライバシーポリシー / Privacy Policy

最后更新 / 最終更新 / Last updated: 2026-11-27

## 中文

「5ch 中文论坛风 UI 改造」不收集、不出售、不上传任何个人数据。

- **存储**：你的设置（主题和各项开关）保存在浏览器的 `chrome.storage.local`。另外在 5ch 页面的 localStorage 里存一份副本（键名 `__cn5ch_settings_cache_v3`），用来在页面加载前套用主题、避免闪屏。两者都只保存在你自己的电脑上。
- **网络**：扩展本身不发起任何网络请求，不含统计代码，也不加载远程代码。
  - 开启「高清图片画廊」时，帖子里的图片链接会由浏览器直接从图片所在的网站加载（不发送 Referer）。
  - 开启「外链直达」时，点击帖子里的外链会直接打开目标网站，不再经过 jump.5ch 中转页。
- **权限**：`storage` 只用来保存上述设置；内容脚本只在 5ch.io / 5ch.net 的页面上运行。
- **删除**：卸载扩展即删除 `chrome.storage.local` 里的设置；页面 localStorage 里的副本可以通过清除 5ch 的网站数据删除。

## 日本語

「5ch 中華掲示板スタイル UI」は、個人データを収集・販売・送信しません。

- **保存**：設定（テーマと各スイッチ）はブラウザの `chrome.storage.local` に保存されます。ページ読み込み前にテーマを適用して画面のちらつきを防ぐため、5ch のページの localStorage にも同じ設定のコピー（キー名 `__cn5ch_settings_cache_v3`）を保存します。どちらもお使いのパソコンの中だけに保存されます。
- **通信**：拡張機能自体は通信を一切行わず、アクセス解析も、外部から読み込むコードもありません。
  - 「画像ギャラリー」がオンのとき、レスに貼られた画像はブラウザが画像のあるサイトから直接読み込みます（Referer は送りません）。
  - 「外部リンク直通」がオンのとき、レス内の外部リンクは jump.5ch を経由せずにリンク先を直接開きます。
- **権限**：`storage` は上記の設定の保存にだけ使います。コンテンツスクリプトは 5ch.io / 5ch.net のページでのみ動作します。
- **削除**：拡張機能をアンインストールすると `chrome.storage.local` の設定は削除されます。localStorage のコピーは 5ch のサイトデータを削除すると消えます。

## English

"5ch Chinese Forum Style UI" does not collect, sell or transmit any personal data.

- **Storage**: your settings (theme and feature toggles) are kept in the browser's `chrome.storage.local`. A copy is also cached in the localStorage of 5ch pages (key `__cn5ch_settings_cache_v3`) so the theme can be applied before the page renders, avoiding a flash. Both stay on your own computer.
- **Network**: the extension itself makes no network requests, contains no analytics and loads no remote code.
  - With "image gallery" on, images linked in posts are loaded by the browser directly from the hosts they are on (no Referer is sent).
  - With "direct links" on, external links in posts open their destination directly instead of going through the jump.5ch redirect page.
- **Permissions**: `storage` is used only for the settings above; the content scripts run only on 5ch.io / 5ch.net pages.
- **Deletion**: uninstalling the extension removes the settings in `chrome.storage.local`; the localStorage copy is removed when you clear 5ch's site data.

Questions / 問い合わせ: [GitHub Issues](https://github.com/Chrisutina/5ch-cn-forum-ui/issues)
