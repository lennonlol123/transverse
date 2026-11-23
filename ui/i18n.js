/* Interface language for the play page (2026-11-24). Chinese covers the frame around the game: the consent
 * page, the run bar, the threshold and the finale, and the GUI's own labels (buttons, panel titles, the status
 * lamp). Everything the engine prints — prompts, the Record, card names, commands such as END — stays English,
 * exactly as in the research version. The language is stored with each save. */
(function () {
  'use strict';
  const KEY = 'tv-lang';
  const query = new URLSearchParams(location.search).get('lang');
  let lang = query === 'zh' || query === 'en' ? query : null;
  try { if (lang) localStorage.setItem(KEY, lang); else lang = localStorage.getItem(KEY); } catch (_) {}
  if (lang !== 'zh') lang = 'en';

  // data-i18n keys (static markup; may hold <strong>).
  const KEYS = {
    how: '旅途须知',
    before: '启程之前',
    taking: '写在出发前',
    intro: 'TransVerse 是西湖大学 Encode Lab 的一项研究基准。在这里，你可以用浏览器亲自走一趟。出发之前，请读一读下面几件事。',
    kept: '<strong>保存哪些内容。</strong>你的操作、你写的笔记，以及开始和保存的时间。这个游玩版本只把它们保存在你的浏览器里，不会发送给我们；你可以导出一份，自行决定是否分享。',
    anon: '<strong>匿名。</strong>每次游玩会得到一个随机编号。我们不收集姓名、账号或联系方式。请不要在笔记里写姓名或其他能识别身份的信息。',
    vol: '<strong>自愿。</strong>你可以随时停止。重新开始会覆盖这里保存的游玩。',
    'lang-note': '<strong>语言。</strong>界面是中文的；游戏里的提示、记录、卡牌名和指令保持英文，与研究使用的版本一致。',
    adult: '我已年满 18 岁。',
    agree: '我已阅读以上内容并同意参与。',
    continue: '继续存档',
    'export-save': '导出存档',
    foot: '第一次开始时会下载游戏运行环境（约 20 MB）。建议使用台式机或笔记本电脑的浏览器。',
    finish: '五个宇宙都已走过。记得导出存档，留下这段旅程。',
    run: '编号',
    iface: '界面版本',
    local: '仅保存在本浏览器',
  };
  // Whole phrases (dynamic labels, notices, the GUI's own labels and status lamp).
  const PHRASES = {
    'Start playing': '启程', 'New playthrough': '重新开始', 'Continue': '继续', 'Show': '展开', 'Hide': '收起',
    'Motion: on': '动效：开', 'Motion: reduced': '动效：减弱',
    'Open the door': '推门', 'BETWEEN UNIVERSES': '两界之间',
    'The journey ends here': '旅程在此落幕', 'Thank you for travelling through the five universes.': '谢谢你，走过这五个宇宙。',
    'Export your record': '带走这段旅程', 'Back to the start': '回到起点', 'Back to the game': '回到游戏',
    'Preparing your game… The first load downloads the browser runtime.': '正在准备游戏……第一次加载需要下载浏览器运行环境。',
    'Progress saved. You may close this tab or continue.': '进度已保存。你可以关闭页面，或继续游玩。',
    'Save downloaded to your device.': '存档已下载到你的设备。',
    'There is no saved game yet.': '还没有存档。',
    'Browser storage is unavailable. Allow site storage to play and save your progress.': '浏览器存储不可用。请允许本站使用存储，才能游玩并保存进度。',
    'Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.': '要重新开始吗？这会覆盖本浏览器里的存档。如需保留，请先导出。',
    // GUI labels and the status lamp
    'Export': '导出', 'Quit': '退出', 'Latest': '最新', 'Enter': '输入', 'Submit notes': '提交笔记', 'Record': '记录',
    'YOU': '你', 'TURN': '回合', 'THEM': '对手', 'Working note': '工作便签',
    'Ready': '就绪', 'In play': '游戏中', 'Finished': '已完成', 'Stopped': '已停止', 'Your move': '轮到你', 'Choose': '请选择',
    'Write notes': '写笔记', 'Reconnecting': '重新连接', 'Connecting': '连接中', 'Sending': '发送中', 'Playing': '进行中',
  };
  const t = text => (lang === 'zh' && Object.prototype.hasOwnProperty.call(PHRASES, text)) ? PHRASES[text] : text;
  const fmt = {
    position: (run, u) => lang === 'zh' ? `${run} · 宇宙 ${u} / 5 · 共 4 世` : `${run} · Universe ${u} of 5 · Episodes 4`,
    next: u => lang === 'zh' ? `前往第${'一二三四五'[u - 1]}宇宙` : `Continue to Universe ${u}`,
    where: u => lang === 'zh' ? `第${'一二三四五'[u - 1]}宇宙 · 共五` : `UNIVERSE 0${u} / 05`,
  };
  function apply(root = document) {
    if (lang !== 'zh') return;
    document.documentElement.lang = 'zh-CN';
    for (const el of root.querySelectorAll('[data-i18n]')) {
      const zh = KEYS[el.dataset.i18n];
      if (zh && el.dataset.i18nDone !== '1') { el.innerHTML = zh; el.dataset.i18nDone = '1'; el.hidden = false; }
    }
    for (const el of root.querySelectorAll('.th-sub, #thresholdOpen, .th-end h2, .th-end p, #thExport, .th-end-actions a, #thClose')) {
      const zh = t(el.textContent.trim());
      if (zh !== el.textContent.trim()) el.textContent = zh;
    }
  }
  // The GUI's own labels: re-applied whenever the GUI redraws them.
  const CHROME = '#export, #stop, #scrollLatest, #rawSubmit, #noteSubmit, #transcriptTitle, .hud-tag, .work-note .field-label, #statusText';
  function chrome() {
    if (lang !== 'zh') return;
    for (const el of document.querySelectorAll(CHROME)) {
      const en = el.textContent.trim(), zh = t(en);
      if (zh !== en) el.textContent = zh;
    }
    for (const el of document.querySelectorAll('.hud-turn-left')) {
      const m = /^(\d+)\s+LEFT$/i.exec(el.textContent.trim());
      if (m) el.textContent = `剩 ${m[1]} 回合`;
    }
  }
  function switchTo(next) {
    const url = new URL(location.href); url.searchParams.set('lang', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
    location.href = url.toString();
  }
  window.TVi18n = Object.freeze({lang, t, fmt, apply, chrome, switchTo});
  document.addEventListener('DOMContentLoaded', () => apply());
})();
