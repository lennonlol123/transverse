"""Chinese versions of the outer pages (dist/zh/), generated from the English sources at build time.

The outer pages run no script (their CSP has no script-src), so the language is a second set of static pages,
not a switch in the browser. Each page is the English page with an ordered list of exact replacements; a
replacement that no longer matches stops the build, so an English edit cannot silently leave stale Chinese.

Voice (2026-11-24, the user's call): keep it poetic — a traveller's register (启程, 一世, 初至 · 困顿 · 试探 ·
封缄) — but tight: no padding, no word that mis-describes the game (the letter is carried through the door, not
posted, so never 寄信). Consent and data text stays plain and exact.
The paper's title stays in English. A life is 一世.
"""
from pathlib import Path

COMMON = [
    ('<html lang="en">', '<html lang="zh-CN">'),
    ('href="site.css"', 'href="../site.css"'),
    ('href="favicon.svg"', 'href="../favicon.svg"'),
    ('src="assets/', 'src="../assets/'),
    ('alt="Westlake University"', 'alt="西湖大学"'),
]

EN = lambda href: f'<span class="lang-toggle"><b>EN</b><a href="{href}" lang="zh-CN">中文</a></span>'
ZH = lambda href: f'<span class="lang-toggle"><a href="{href}" lang="en">EN</a><b>中文</b></span>'

PAGES = {
    'index.html': [
        (EN('zh/'), ZH('../')),
        ('>ENTER <svg', '>启程 <svg'),
    ],
    'welcome.html': [
        ('<a href="how-it-works.html">How it works</a><a href="enter.html#evaluate">For AI agents</a><a href="#lab">Lab</a></nav>',
         '<a href="how-it-works.html">旅途须知</a><a href="enter.html#evaluate">智能体</a><a href="#lab">我们</a></nav>'),
        ('<a class="btn small" href="enter.html">ENTER</a>' + EN('zh/welcome.html'),
         '<a class="btn small" href="enter.html">启程</a>' + ZH('../welcome.html')),
        ('<p>A research benchmark from Encode Lab. Play it, or send an agent.</p>',
         '<p>Encode Lab 的一项研究基准。亲自启程，或让智能体替你远行。</p>'),
        ('<a class="btn solid" href="enter.html">ENTER <svg class="door-icon"', '<a class="btn solid" href="enter.html">启程 <svg class="door-icon"'),
        ('<a class="btn" href="how-it-works.html">HOW IT WORKS</a>', '<a class="btn" href="how-it-works.html">旅途须知</a>'),
        ('<span class="eyebrow">Made by</span>', '<span class="eyebrow">我们</span>'),
        ('<p>We’re at Westlake University, working on AI evaluation and efficient AI. Join our experiment and help take AI one step further.</p>',
         '<p>我们来自西湖大学，研究 AI 评测与高效 AI。加入我们的实验，让 AI 的智能更进一步。</p>'),
    ],
    'enter.html': [
        ('<title>Enter · TransVerse</title>', '<title>启程 · TransVerse</title>'),
        ('<span class="bar-right"><a class="small-caps" href="welcome.html">Back</a>' + EN('zh/enter.html') + '</span>',
         '<span class="bar-right"><a class="small-caps" href="welcome.html">返回</a>' + ZH('../enter.html') + '</span>'),
        ('<h1>Enter the multiverse</h1><p>One door. Two ways in.</p>', '<h1>推开多元宇宙之门</h1><p>一扇门，两条路。</p>'),
        ('aria-label="Play as a human"', 'aria-label="亲自启程"'),
        ('<span class="eyebrow">For humans</span><h2>Play</h2><p>In your browser. No account needed.</p>',
         '<span class="eyebrow">旅人</span><h2>亲自启程</h2><p>只需一个浏览器，无需账号。</p>'),
        ('<a class="btn solid" href="play/">START PLAYING</a>', '<a class="btn solid" href="../play/?lang=zh">启程</a>'),
        ('<p class="fine">Your moves and notes stay in your browser under a random ID. Share them only if you choose, and stop at any time. Details come before you start.</p>',
         '<p class="fine">你的操作和笔记以随机编号保存在你自己的浏览器里。是否分享由你决定，也可随时停止。开始前会有详细说明。</p>'),
        ('aria-label="Evaluate an AI agent"', 'aria-label="送智能体启程"'),
        ('<span class="eyebrow">For AI agents</span><h2>Evaluate</h2><p>Connect an agent and run it on a private set we never release. You get aggregate scores.</p>',
         '<span class="eyebrow">智能体</span><h2>送它启程</h2><p>接入一位智能体，让它走过一组从不公开的世界。归来的，只有一份汇总的分数。</p>'),
        ('>ACCESS OPENS SOON</span>', '>即将开放</span>'),
        ('<a class="plain-link" href="how-it-works.html#agents">How it works</a>', '<a class="plain-link" href="how-it-works.html#agents">旅途须知</a>'),
    ],
    'how-it-works.html': [
        ('<title>How it works · TransVerse</title>', '<title>旅途须知 · TransVerse</title>'),
        ('<span class="small-caps muted">How it works</span>', '<span class="small-caps muted">旅途须知</span>'),
        ('<span class="bar-right"><a class="btn small" href="enter.html">ENTER</a>' + EN('zh/how-it-works.html') + '</span>',
         '<span class="bar-right"><a class="btn small" href="enter.html">启程</a>' + ZH('../how-it-works.html') + '</span>'),
        ('<h1>Five universes.<br>Hidden rules.</h1>', '<h1>五个宇宙，<br>各有不言之律。</h1>'),
        ('<p>Each universe has rules no one tells you. Find them, write them down, carry them on.</p>',
         '<p>每个宇宙都有无人言说的规则。找出来，写下来，带下去。</p>'),
        ('aria-label="At a glance"', 'aria-label="一览"'),
        ('<span>universes</span>', '<span>个宇宙</span>'),
        ('<span>lives, four per universe</span>', '<span>世，每个宇宙四世</span>'),
        ('<span>letter carried to the next</span>', '<span>封信，带往下一个宇宙</span>'),
        ('aria-label="Universes"', 'aria-label="宇宙"'),
        ('<h2>Five universes</h2>', '<h2>五个宇宙</h2>'),
        ('src="play/art/', 'src="../play/art/'),
        ('href="play/art/', 'href="../play/art/'),
        ('aria-label="A dotted path winds through the five universes; the traveller is just setting out."', 'aria-label="一条点线小路蜿蜒穿过五个宇宙，旅人刚刚启程。"'),
        ('<span>UNIVERSE I</span><span>Firefly Thicket</span>', '<span>宇宙 I</span><span>流萤秘林</span>'),
        ('<span>UNIVERSE II</span><span>Silent Silhouettes</span>', '<span>宇宙 II</span><span>无声剪影</span>'),
        ('<span>UNIVERSE III</span><span>Ink-Mist Mountains</span>', '<span>宇宙 III</span><span>墨岚山水</span>'),
        ('<span>UNIVERSE IV</span><span>Alien Pulse</span>', '<span>宇宙 IV</span><span>异星脉冲</span>'),
        ('<span>UNIVERSE V</span><span>Verdigris Workshop</span>', '<span>宇宙 V</span><span>铜锈工坊</span>'),
        ('<h2>A life in a universe</h2>', '<h2>一世之中</h2>'),
        ('<h3>Arrive</h3><p>Every card and symbol is new. Use them to learn them.</p>',
         '<h3>初至</h3><p>每张牌、每个符号都是陌生的。用过，才知道。</p>'),
        ('<h3>Struggle</h3><p>Some opponents follow rules you can’t see. Old moves stop working.</p>',
         '<h3>困顿</h3><p>有些对手遵循你看不见的法则。老办法，渐渐失灵。</p>'),
        ('<h3>Test</h3><p>Form a hunch. Try something new. Watch what changes.</p>',
         '<h3>试探</h3><p>有了猜想，换种走法，看看什么变了。</p>'),
        ('<h3>Write the letter</h3><p>Before you cross, write down what you learned. It’s all you take with you.</p>',
         '<h3>封缄</h3><p>临行前，把所学写进信里，封好。它是你唯一的行囊。</p>'),
        ('aria-label="Agents"', 'aria-label="智能体"'),
        ('<span class="eyebrow">For AI agents</span>', '<span class="eyebrow">智能体</span>'),
        ('<h2>Same worlds. Same rules. Same letter.</h2>', '<h2>同样的世界，同样的规则，同样的一封信。</h2>'),
        ('<p>Agents see exactly what players see, and write under the same limits.</p>',
         '<p>智能体所见即玩家所见，书写的限制也一样。</p>'),
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
