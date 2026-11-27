(() => {
  'use strict';

  // 插件自己的中文界面文字 → 日文意思的罗马字（修正式黑本式，长音带横线）。
  // 以 <ruby> 注在中文上方，中国人看汉字、日本人看罗马字。键按最长匹配切分；
  // 一段文字里只要有一个汉字串切不完，整段原样返回，所以 5ch 自己的日文标题、作者名不会被误注。
  // 新增界面文案后跑 `node tools/check-romaji.mjs`，它会列出词典没覆盖的中文。
  const DICT = new Map(Object.entries({
    // 顶栏 / 主题 / 通用
    社区: 'komyuniti',
    热门广场: 'ninki hiroba',
    实时热榜: 'ikioi rankingu',
    全站板块: 'ita ichiran',
    板块: 'ita',
    搜索帖子标题: 'suretai kensaku',
    极简白: 'raito',
    羊皮纸: 'yōhishi',
    极简黑: 'dāku',
    已切换主题: 'tēma henkō',
    切换主题: 'tēma kirikae',
    原版: 'orijinaru',
    临时关闭美化: 'dezain o ichiji ofu',
    显示: 'hyōji',
    原版页面: 'orijinaru gamen',
    返回顶部: 'toppu e',
    直达底部回帖框: 'kakikomi-ran e',
    匿名: 'tokumei',
    没有匹配结果: 'gaitō nashi',

    // 帖子页
    楼主: 'surenushi',
    回复: 'resu',
    回复数: 'resu-sū',
    复制: 'kopī',
    已复制: 'kopī zumi',
    跳转: 'idō',
    亮评: 'ninki resu',
    本帖亮评: 'ninki resu',
    全部: 'zenbu',
    只看楼主: 'surenushi nomi',
    带图: 'gazō ari',
    筛选本帖内容: 'sure-nai kensaku',
    快速回帖: 'kakikomu',
    发表回复: 'kakikomi',
    收起: 'tojiru',
    展开: 'hiraku',
    楼中楼: 'tsurī',
    展开楼中楼: 'tsurī o hiraku',
    收起楼中楼: 'tsurī o tojiru',
    只看: 'nomi hyōji',
    只看该作者: 'kono hito nomi',
    点击切换: 'kirikae',
    已取消作者筛选: 'firuta kaijo',
    不在本页: 'pēji-gai',
    点击跳转查看: 'kurikku de idō',
    请切换到: 'kirikaete',
    查看: 'miru',
    图片或表情回复: 'gazō / emoji no resu',
    未找到回帖框: 'kakikomi-ran nashi',
    已引用: "in'yō shita",
    浏览器不支持剪贴板写入: 'kopī dekimasen',

    // 首页
    新闻速报: 'nyūsu sokuhō',
    实况: 'jikkyō',
    嫌储: 'kenmō',
    编程开发: 'puroguramu',
    科学新闻: 'kagaku nyūsu',
    艺能体育: 'geisupo',
    硬件: 'hādo',
    热度: 'ikioi',
    热议: 'wadai',
    全部动态: 'subete',
    热门高楼: 'ninki sure',
    筛选本页帖子: 'pēji-nai kensaku',
    社区热帖广场: 'ninki sure hiroba',
    热门板块直达: 'ninki ita',
    全部分区: 'zen kategori',
    全站实时榜单: 'ikioi rankingu',
    进入热榜: 'rankingu e',
    键: 'kī',
    搜索全站帖子: 'zen sure kensaku',
    帖子页: 'sure gamen',
    引用直达: "in'yō jampu",
    看大图: 'gazō kakudai',

    // 板块页 / subback / 過去ログ / 搜索
    热: 'ninki',
    爆: 'matsuri',
    热帖: 'ninki sure',
    帖: 'sure',
    本页: 'kono pēji',
    默认顺序: 'hyōjun',
    回复最多: 'resu ōi jun',
    回复最少: 'resu sukunai jun',
    搜索本板块帖子标题: 'ita-nai suretai kensaku',
    热门主题预览: 'ninki sure purebyū',
    没有正文预览: 'purebyū nashi',
    在本板块发表新主题: 'kono ita ni sure tate',
    本页没有发帖表单: 'tōkō fōmu nashi',
    请到新版板块页发帖: 'shin-ban ita kara tōkō',
    帖子列表: 'sure ichiran',
    热帖正文预览: 'ninki sure purebyū',
    发表新帖: 'sure tate',
    板块公告与本地规则: 'ita no rōkaru rūru',
    点击展开: 'hiraku',
    板块代码: 'ita kōdo',
    新版板块列表: 'shin-ban ichiran',
    查看全部主题: 'zen sure ichiran',
    全部主题列表: 'zen sure ichiran',
    可搜索: 'kensaku',
    可排序: 'narabikae',
    板块首页: 'ita toppu',
    版规公告: 'rōkaru rūru',
    历史归档: 'kako rogu',
    搜索历史归档帖子标题: 'kako rogu kensaku',
    归档目录: 'kako rogu mokuji',
    暂无其他归档目录: 'hoka no mokuji nashi',
    已清理广告: 'kōkoku jokyo zumi',
    标题可搜索: 'taitoru kensaku',
    返回当前板块: 'ita ni modoru',
    全站归档目录: 'zen kako rogu',
    的搜索结果: 'no kensaku kekka',
    条结果: 'ken',

    // 分类目录 / 全站板块导航 / 热榜
    全站实时热榜: 'ikioi rankingu',
    全站板块分类目录: 'ita kategori ichiran',
    分区索引: 'mokuji',
    个分区: 'kategori',
    个板块: 'ita',
    全站板块导航: 'zen ita ichiran',
    按分区平铺全部板块: 'kategori-betsu zen ita',
    右侧索引可快速跳转: 'migi no mokuji kara idō',
    搜索板块或分区: 'ita / kategori kensaku',
    例: 'rei',

    // 设置弹窗
    中文论坛风: 'chūka keijiban',
    极简现代组件: 'shinpuru dezain',
    广告净化: 'kōkoku jokyo',
    主题配色: 'tēma',
    护眼暖黄: 'me ni yasashii',
    增强功能: 'kakuchō kinō',
    广告与遮挡弹窗净化: 'kōkoku · poppuappu jokyo',
    隐藏侧栏: 'saido kakusu',
    信息流与全屏广告: 'fīdo · zengamen kōkoku',
    外链直达: 'rinku chokusetsu',
    跳过: 'sukippu',
    点击帖子外链直接打开目标网站: 'rinku-saki o chokusetsu hiraku',
    高清图片画廊与灯箱: 'gazō gyararī',
    自动隐藏原版打码小方块: 'mozaiku o jidō de kakusu',
    点击看大图: 'kakudai hyōji',
    紧凑阅读密度: 'konpakuto hyōji',
    缩小楼层留白: 'yohaku o herasu',
    一屏浏览更多回复: 'ichido ni ōku no resu',
    首页: 'toppu',
    实时生效: 'sokuji hanei',
    已保存: 'hozon zumi',
    预览模式: 'purebyū mōdo'
  }));

  const MAX_KEY = Math.max(...Array.from(DICT.keys(), (k) => k.length));
  const HAN = /[㐀-鿿豈-﫿]+/g;
  // a Han run plus the CJK punctuation glued to it: ruby boxes are atomic, so a loose 「。」 would wrap alone
  const RUN = /([「『（【《“]*)([㐀-鿿豈-﫿]+)([」』）】》”。，、：；！？…+＋]*)/g;
  const memo = new Map();

  // Longest-match split of one Han run into dictionary words; null when any part is unknown
  function segment(run) {
    if (memo.has(run)) return memo.get(run);
    let words = [];
    for (let i = 0; i < run.length; ) {
      let len = Math.min(MAX_KEY, run.length - i);
      while (len > 0 && !DICT.has(run.slice(i, i + len))) len -= 1;
      if (!len) {
        words = null;
        break;
      }
      words.push(run.slice(i, i + len));
      i += len;
    }
    memo.set(run, words);
    return words;
  }

  // String → <span class="cn5ch-romaji"> with <ruby> per word, or the string itself when it is not (all) plugin Chinese
  function rubify(text) {
    const str = String(text);
    const runs = str.match(HAN);
    if (!runs || !runs.every(segment)) return str;
    const wrap = document.createElement('span');
    wrap.className = 'cn5ch-romaji';
    let last = 0;
    for (const m of str.matchAll(RUN)) {
      const [whole, open, run, close] = m;
      if (m.index > last) wrap.append(str.slice(last, m.index));
      const words = segment(run);
      words.forEach((word, i) => {
        const rt = document.createElement('rt');
        rt.textContent = DICT.get(word);
        rt.setAttribute('translate', 'no');
        const ruby = document.createElement('ruby');
        ruby.append(`${i === 0 ? open : ''}${word}${i === words.length - 1 ? close : ''}`, rt);
        wrap.append(ruby);
      });
      last = m.index + whole.length;
    }
    if (last < str.length) wrap.append(str.slice(last));
    return wrap;
  }

  // Annotate every text node under root (settings popup: all of it is plugin text)
  function annotateTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.parentElement.closest('script, style, rt, .cn5ch-romaji')) nodes.push(n);
    }
    nodes.forEach((n) => {
      const out = rubify(n.nodeValue);
      if (typeof out !== 'string') n.replaceWith(out);
    });
  }

  window.CN5CH = window.CN5CH || {};
  window.CN5CH.romaji = { DICT, segment, rubify, annotateTree };
})();
