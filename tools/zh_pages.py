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
        ('>ENTER <svg', '>启程 <svg'),
    ],
    'welcome.html': [
        ('<a href="how-it-works.html">How it works</a><a href="#agents">For AI agents</a><a href="#lab">Lab</a><a href="zh/welcome.html" lang="zh-CN">中文</a>',
         '<a href="how-it-works.html">旅途须知</a><a href="#agents">遣智能体</a><a href="#lab">我们</a><a href="../welcome.html" lang="en">EN</a>'),
        ('<a class="btn small" href="enter.html">ENTER</a>', '<a class="btn small" href="enter.html">启程</a>'),
        ('<p>A research benchmark from Encode Lab. Take part by playing in the browser, or evaluate an agent.</p>',
         '<p>一个关于学习、记忆与迁移的研究基准，来自 Encode Lab。你可以亲自穿过这些宇宙，也可以遣一位智能体代你前往。</p>'),
        ('<a class="btn solid" href="enter.html">ENTER</a><a class="btn" href="how-it-works.html">HOW IT WORKS</a>',
         '<a class="btn solid" href="enter.html">启程</a><a class="btn" href="how-it-works.html">旅途须知</a>'),
        ('<span class="eyebrow">For AI agents</span>\n      <h2>Evaluate an agent</h2>\n      <p>Submit an agent to be evaluated on a private set that is never released. You receive aggregate scores.</p>',
         '<span class="eyebrow">遣智能体</span>\n      <h2>让它代你远行</h2>\n      <p>它将去往一组从不公开的世界。归来的，只有一份汇总的分数。</p>'),
        ('>EVALUATE AN AGENT</a>', '>遣它前往</a>'),
        ('<span class="eyebrow">Made by</span>', '<span class="eyebrow">我们</span>'),
        ('<p>Westlake University. Your play supports our research on how people and machines learn. Taking part is voluntary and anonymous.</p>',
         '<p>西湖大学。我们想知道，人与机器如何在陌生的世界里学会规则，又如何把所学带往他方。你的每一次游玩，都在回答这个问题。参与全凭自愿，不留姓名。</p>'),
    ],
    'enter.html': [
        ('<title>Enter · TransVerse</title>', '<title>启程 · TransVerse</title>'),
        ('<span class="bar-right"><a class="small-caps" href="zh/enter.html" lang="zh-CN">中文</a><a class="small-caps" href="welcome.html">Back</a></span>',
         '<span class="bar-right"><a class="small-caps" href="../enter.html" lang="en">EN</a><a class="small-caps" href="welcome.html">返回</a></span>'),
        ('<h1>Enter the multiverse</h1><p>One entrance. Two ways in.</p>', '<h1>推开多元宇宙之门</h1><p>一扇门，两条路。</p>'),
        ('aria-label="Play as a human"', 'aria-label="以人类身份游玩"'),
        ('<span class="eyebrow">For humans</span><h2>Play</h2><p>Play in the browser. No account needed.</p>',
         '<span class="eyebrow">旅人</span><h2>亲自启程</h2><p>只需一个浏览器，无需账号。</p>'),
        ('<a class="btn solid" href="play/">START PLAYING</a>', '<a class="btn solid" href="../play/?lang=zh">启程</a>'),
        ('<p class="fine">Your moves and notes stay in your browser under a random ID. You can export them and decide whether to share them, and you can stop at any time. You will see the details before you start.</p>',
         '<p class="fine">你的操作和笔记以一个随机编号保存在你自己的浏览器里。你可以导出它们并自行决定是否分享，也可以随时停止。开始前你会看到详细说明。</p>'),
        ('aria-label="Evaluate an AI agent"', 'aria-label="评测智能体"'),
        ('<span class="eyebrow">For AI agents</span><h2>Evaluate</h2><p>Connect an agent and run it on a private set that is never released. You receive aggregate scores.</p>',
         '<span class="eyebrow">智能体</span><h2>遣它前往</h2><p>接入一位智能体，让它走过一组从不公开的世界。归来的，只有一份汇总的分数。</p>'),
        ('>ACCESS OPENS SOON</span>', '>即将开放</span>'),
        ('<a class="plain-link" href="how-it-works.html#agents">How it works</a>', '<a class="plain-link" href="how-it-works.html#agents">旅途须知</a>'),
    ],
    'how-it-works.html': [
        ('<title>How it works · TransVerse</title>', '<title>旅途须知 · TransVerse</title>'),
        ('<span class="small-caps muted">How it works</span>', '<span class="small-caps muted">旅途须知</span>'),
        ('<span class="bar-right"><a class="small-caps" href="zh/how-it-works.html" lang="zh-CN">中文</a><a class="btn small" href="enter.html">ENTER</a></span>',
         '<span class="bar-right"><a class="small-caps" href="../how-it-works.html" lang="en">EN</a><a class="btn small" href="enter.html">启程</a></span>'),
        ('<h1>Five universes.<br>Hidden rules.</h1>', '<h1>五个宇宙，<br>各有不言之律。</h1>'),
        ('<p>Every universe plays by rules nobody tells you. Find them by playing, write down what you learned, and carry it into the next world.</p>',
         '<p>每个宇宙都藏着无人言说的规则。在游历中把它们找出来，写下所得，再带往下一个世界。</p>'),
        ('aria-label="At a glance"', 'aria-label="一览"'),
        ('<span>universes to explore</span>', '<span>个宇宙，等你一一走过</span>'),
        ('<span>lives to learn what is going on, four in each universe</span>', '<span>世轮回，每个宇宙四世，用来看清这里的道理</span>'),
        ('<span>letter that crosses into the next world</span>', '<span>封信，是你唯一能带过门的东西</span>'),
        ('aria-label="Universes"', 'aria-label="宇宙"'),
        ('<h2>Five universes</h2>', '<h2>五个宇宙</h2>'),
        ('src="play/art/', 'src="../play/art/'),
        ('<span>UNIVERSE I</span><span>Firefly Thicket</span>', '<span>宇宙 I</span><span>流萤秘林</span>'),
        ('<span>UNIVERSE II</span><span>Silent Silhouettes</span>', '<span>宇宙 II</span><span>无声剪影</span>'),
        ('<span>UNIVERSE III</span><span>Ink-Mist Mountains</span>', '<span>宇宙 III</span><span>墨岚山水</span>'),
        ('<span>UNIVERSE IV</span><span>Alien Pulse</span>', '<span>宇宙 IV</span><span>异星脉冲</span>'),
        ('<span>UNIVERSE V</span><span>Verdigris Workshop</span>', '<span>宇宙 V</span><span>铜锈工坊</span>'),
        ('<h2>A life in a universe</h2>', '<h2>一世之中</h2>'),
        ('<h3>Arrive</h3><p>Every card and every symbol is new. You find out what they do by using them.</p>',
         '<h3>初至</h3><p>每一张牌、每一个符号都是陌生的。用过，才知道它们会做什么。</p>'),
        ('<h3>Struggle</h3><p>Some opponents follow rules you cannot see. Your usual moves stop working.</p>',
         '<h3>困顿</h3><p>有些对手遵循着你看不见的法则，惯常的打法渐渐失灵。</p>'),
        ('<h3>Test</h3><p>Form a hunch, try something different, and watch what changes.</p>',
         '<h3>试探</h3><p>心里有了猜想，就换一种走法，看看什么随之改变。</p>'),
        ('<h3>Write the letter</h3><p>Before you cross, write what you learned. In the next universe, it is all you take with you.</p>',
         '<h3>寄信</h3><p>临行之前，把所学写成一封信。到了下一个宇宙，它是你唯一的行囊。</p>'),
        ('aria-label="Agents"', 'aria-label="智能体"'),
        ('<span class="eyebrow">For AI agents</span>', '<span class="eyebrow">智能体</span>'),
        ('<h2>Same worlds. Same rules. Same letter.</h2>', '<h2>同样的世界，同样的规则，同样的一封信。</h2>'),
        ('<p>Agents play exactly what a human player sees, under the same limits on what they can write down.</p>',
         '<p>智能体所见，与人类旅人所见分毫不差；能写下的字数，也受同样的限制。</p>'),
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
