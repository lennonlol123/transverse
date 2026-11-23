"""Chinese versions of the outer pages (dist/zh/), generated from the English sources at build time.

The outer pages run no script (their CSP has no script-src), so the language is a second set of static pages,
not a switch in the browser. Each page is the English page with an ordered list of exact replacements; a
replacement that no longer matches stops the build, so an English edit cannot silently leave stale Chinese.
The paper's title stays in English. Gameplay words follow the project's Chinese naming: a life is 世.
"""
from pathlib import Path

COMMON = [
    ('<html lang="en">', '<html lang="zh-CN">'),
    ('href="site.css"', 'href="../site.css"'),
    ('href="favicon.svg"', 'href="../favicon.svg"'),
    ('src="assets/', 'src="../assets/'),
    ('alt="Westlake University"', 'alt="西湖大学"'),
]

PAGES = {
    'index.html': [
        ('<a class="lang-switch" href="zh/" lang="zh-CN">中文</a>', '<a class="lang-switch" href="../" lang="en">EN</a>'),
        ('>ENTER <svg', '>进入 <svg'),
    ],
    'welcome.html': [
        ('<a href="how-it-works.html">How it works</a><a href="#agents">For AI agents</a><a href="#lab">Lab</a><a href="zh/welcome.html" lang="zh-CN">中文</a>',
         '<a href="how-it-works.html">玩法说明</a><a href="#agents">智能体评测</a><a href="#lab">团队</a><a href="../welcome.html" lang="en">EN</a>'),
        ('<a class="btn small" href="enter.html">ENTER</a>', '<a class="btn small" href="enter.html">进入</a>'),
        ('<p>A research benchmark from Encode Lab. Take part by playing in the browser, or evaluate an agent.</p>',
         '<p>一个关于持续学习与跨多元宇宙智能迁移的研究基准，来自 Encode Lab。你可以在浏览器里亲自游玩，也可以评测一个智能体。</p>'),
        ('<a class="btn solid" href="enter.html">ENTER</a><a class="btn" href="how-it-works.html">HOW IT WORKS</a>',
         '<a class="btn solid" href="enter.html">进入</a><a class="btn" href="how-it-works.html">玩法说明</a>'),
        ('<span class="eyebrow">For AI agents</span>\n      <h2>Evaluate an agent</h2>\n      <p>Submit an agent to be evaluated on a private set that is never released. You receive aggregate scores.</p>',
         '<span class="eyebrow">智能体评测</span>\n      <h2>评测智能体</h2>\n      <p>提交一个智能体，在一个从不公开的私有集上评测。你会收到汇总分数。</p>'),
        ('>EVALUATE AN AGENT</a>', '>评测智能体</a>'),
        ('<span class="eyebrow">Made by</span>', '<span class="eyebrow">研究团队</span>'),
        ('<p>Westlake University. Your play supports our research on how people and machines learn. Taking part is voluntary and anonymous.</p>',
         '<p>西湖大学。你的游玩会支持我们关于人与机器如何学习的研究。参与完全自愿且匿名。</p>'),
    ],
    'enter.html': [
        ('<title>Enter · TransVerse</title>', '<title>进入 · TransVerse</title>'),
        ('<span class="bar-right"><a class="small-caps" href="zh/enter.html" lang="zh-CN">中文</a><a class="small-caps" href="welcome.html">Back</a></span>',
         '<span class="bar-right"><a class="small-caps" href="../enter.html" lang="en">EN</a><a class="small-caps" href="welcome.html">返回</a></span>'),
        ('<h1>Enter the multiverse</h1><p>One entrance. Two ways in.</p>', '<h1>进入多元宇宙</h1><p>一个入口，两条路。</p>'),
        ('aria-label="Play as a human"', 'aria-label="以人类身份游玩"'),
        ('<span class="eyebrow">For humans</span><h2>Play</h2><p>Play in the browser. No account needed.</p>',
         '<span class="eyebrow">人类玩家</span><h2>游玩</h2><p>在浏览器里直接玩，不需要账号。</p>'),
        ('<a class="btn solid" href="play/">START PLAYING</a>', '<a class="btn solid" href="../play/?lang=zh">开始游戏</a>'),
        ('<p class="fine">Your moves and notes stay in your browser under a random ID. You can export them and decide whether to share them, and you can stop at any time. You will see the details before you start.</p>',
         '<p class="fine">你的操作和笔记以一个随机编号保存在你自己的浏览器里。你可以导出它们并自行决定是否分享，也可以随时停止。开始前你会看到详细说明。</p>'),
        ('aria-label="Evaluate an AI agent"', 'aria-label="评测智能体"'),
        ('<span class="eyebrow">For AI agents</span><h2>Evaluate</h2><p>Connect an agent and run it on a private set that is never released. You receive aggregate scores.</p>',
         '<span class="eyebrow">智能体</span><h2>评测</h2><p>接入一个智能体，在从不公开的私有集上运行。你会收到汇总分数。</p>'),
        ('>ACCESS OPENS SOON</span>', '>即将开放</span>'),
        ('<a class="plain-link" href="how-it-works.html#agents">How it works</a>', '<a class="plain-link" href="how-it-works.html#agents">玩法说明</a>'),
    ],
    'how-it-works.html': [
        ('<title>How it works · TransVerse</title>', '<title>玩法说明 · TransVerse</title>'),
        ('<span class="small-caps muted">How it works</span>', '<span class="small-caps muted">玩法说明</span>'),
        ('<span class="bar-right"><a class="small-caps" href="zh/how-it-works.html" lang="zh-CN">中文</a><a class="btn small" href="enter.html">ENTER</a></span>',
         '<span class="bar-right"><a class="small-caps" href="../how-it-works.html" lang="en">EN</a><a class="btn small" href="enter.html">进入</a></span>'),
        ('<h1>Five universes.<br>Hidden rules.</h1>', '<h1>五个宇宙。<br>隐藏的规则。</h1>'),
        ('<p>Every universe plays by rules nobody tells you. Find them by playing, write down what you learned, and carry it into the next world.</p>',
         '<p>每个宇宙都有没人告诉你的规则。在游玩中发现它们，写下你学到的东西，再把它带进下一个世界。</p>'),
        ('aria-label="At a glance"', 'aria-label="一览"'),
        ('<span>universes to explore</span>', '<span>个宇宙等你探索</span>'),
        ('<span>lives to learn what is going on, four in each universe</span>', '<span>世，用来弄清发生了什么，每个宇宙 4 世</span>'),
        ('<span>letter that crosses into the next world</span>', '<span>封信，带进下一个世界</span>'),
        ('aria-label="Universes"', 'aria-label="宇宙"'),
        ('<h2>Five universes</h2>', '<h2>五个宇宙</h2>'),
        ('src="play/art/', 'src="../play/art/'),
        ('<span>UNIVERSE I</span><span>Firefly Thicket</span>', '<span>宇宙 I</span><span>流萤秘林</span>'),
        ('<span>UNIVERSE II</span><span>Silent Silhouettes</span>', '<span>宇宙 II</span><span>无声剪影</span>'),
        ('<span>UNIVERSE III</span><span>Ink-Mist Mountains</span>', '<span>宇宙 III</span><span>墨岚山水</span>'),
        ('<span>UNIVERSE IV</span><span>Alien Pulse</span>', '<span>宇宙 IV</span><span>异星脉冲</span>'),
        ('<span>UNIVERSE V</span><span>Verdigris Workshop</span>', '<span>宇宙 V</span><span>铜锈工坊</span>'),
        ('<h2>A life in a universe</h2>', '<h2>宇宙中的一世</h2>'),
        ('<h3>Arrive</h3><p>Every card and every symbol is new. You find out what they do by using them.</p>',
         '<h3>抵达</h3><p>每张牌、每个符号都是新的。用过才知道它们做什么。</p>'),
        ('<h3>Struggle</h3><p>Some opponents follow rules you cannot see. Your usual moves stop working.</p>',
         '<h3>受挫</h3><p>有些对手遵循你看不见的规则。惯用的打法不再奏效。</p>'),
        ('<h3>Test</h3><p>Form a hunch, try something different, and watch what changes.</p>',
         '<h3>试探</h3><p>形成一个猜测，换一种做法，观察什么发生了变化。</p>'),
        ('<h3>Write the letter</h3><p>Before you cross, write what you learned. In the next universe, it is all you take with you.</p>',
         '<h3>写信</h3><p>跨越之前，写下你学到的东西。到了下一个宇宙，这是你唯一能带走的。</p>'),
        ('aria-label="Agents"', 'aria-label="智能体"'),
        ('<span class="eyebrow">For AI agents</span>', '<span class="eyebrow">智能体</span>'),
        ('<h2>Same worlds. Same rules. Same letter.</h2>', '<h2>同样的世界。同样的规则。同样的信。</h2>'),
        ('<p>Agents play exactly what a human player sees, under the same limits on what they can write down.</p>',
         '<p>智能体看到的与人类玩家完全相同，能写下的内容也受同样的限制。</p>'),
    ],
}


def build(site: Path, out: Path):
    (out / 'zh').mkdir(parents=True, exist_ok=True)
    for name, pairs in PAGES.items():
        text = (site / name).read_text()
        for old, new in COMMON + pairs:
            if old not in text:
                raise SystemExit(f'zh/{name}: source text changed, update tools/zh_pages.py: {old[:70]!r}')
            text = text.replace(old, new)
        (out / 'zh' / name).write_text(text)
