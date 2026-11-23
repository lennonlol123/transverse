"""Build an entirely static GitHub Pages site from the reviewed local sources."""
from pathlib import Path
import base64  # noqa: F401  (kept for the font embedding below)
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUT = DIST / "play"
WORLDS = [1, 2, 3, 4, 5]


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    OUT.mkdir(parents=True)
    # Outer pages (portal, welcome, how it works, gate) are plain static files.
    shutil.copytree(ROOT / "site", DIST, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".DS_Store"))
    import sys; sys.path.insert(0, str(ROOT / "tools"))
    import zh_pages
    zh_pages.build(ROOT / "site", DIST)       # Chinese outer pages: dist/zh/
    files = {}
    for p in sorted((ROOT / "engine").rglob("*")):
        if p.suffix not in (".py", ".json") or "__pycache__" in p.parts:
            continue
        files['engine/' + p.relative_to(ROOT / "engine").as_posix()] = p.read_text()
    files['src/browser_runtime.py'] = (ROOT / 'src/browser_runtime.py').read_text()
    (OUT / "engine-bundle.json").write_text(json.dumps(dict(version="public-browser-demo-v1", files=files), ensure_ascii=False))
    for folder in ("src", "vendor", "data", "licenses"):
        shutil.copytree(ROOT / folder, OUT / folder, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    # One painting and one opponent per Universe, served as files next to the page.
    shutil.copytree(ROOT / "ui/art", OUT / "art", dirs_exist_ok=True, ignore=shutil.ignore_patterns(".DS_Store"))
    art = [dict(universe=u, scene=f"art/u{u}-scene.webp", opponent=f"art/u{u}-opponent.webp") for u in WORLDS]
    for row in art:
        assert (OUT / row["scene"]).is_file() and (OUT / row["opponent"]).is_file(), row
    html = (ROOT / 'ui/base.html').read_text()
    font = base64.b64encode((ROOT / 'ui/retro-font.woff').read_bytes()).decode()
    css = "@font-face{font-family:'TV Mono';src:url(data:font/woff;base64," + font + ") format('woff');font-display:block;}\n"
    css += '\n'.join((ROOT / 'ui' / name).read_text() for name in ['skins.css','skin-adapter.css','demo.css'])
    assert html.count('<title>Westlake TransVerse</title>') == 1
    html = html.replace('<title>Westlake TransVerse</title>', '<title>TransVerse</title>')
    html = html.replace('<meta name="color-scheme" content="dark light">', '<meta name="color-scheme" content="light">')
    html = html.replace('</head>', '<meta name="description" content="TransVerse, a research benchmark from Encode Lab, Westlake University."><meta name="robots" content="noindex"><link rel="icon" href="../favicon.svg" type="image/svg+xml"><style>' + css + '</style></head>')
    body = '<body data-setup-open="true" data-phase="idle">'
    assert html.count(body) == 1
    html = html.replace(body, body + '\n' + (ROOT / 'ui/demo.html').read_text() + '\n' + (ROOT / 'ui/threshold.html').read_text(), 1)
    terms = json.loads((ROOT / 'ui/display-terms.json').read_text())['terms']
    adapter = (ROOT / 'ui/skin-adapter.js').read_text().replace('__TV_PUBLIC_ART__', json.dumps(art, separators=(',', ':')))
    adapter = adapter.replace('__TV_TERMS__', json.dumps(terms, separators=(',', ':')))
    assert '__TV_' not in adapter
    marker = "  <script>\n    'use strict';\n    const $"
    assert marker in html
    i18n = (ROOT / 'ui/i18n.js').read_text()
    html = html.replace(marker, '<script>' + i18n + '</script><script>' + adapter + '</script><script src="src/local-api.js"></script>\n' + marker, 1)
    old = """    async function request(path, body) {
      const opts = { cache:'no-store', headers:{'X-AGII-Token':token}, signal:AbortSignal.timeout(10000) };
      if (body !== undefined) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      const response = await fetch(path, opts);
      let data;
      try { data = await response.json(); } catch (_) { throw new Error('The service did not respond. Try again in a moment.'); }
      if (!response.ok) throw new Error(data.error || 'The action did not complete. Try again.');
      return data;
    }"""
    assert old in html, 'Original GUI request adapter changed; review the transport.'
    html = html.replace(old, '    async function request(path, body) { return window.TVLocal.request(path, body); }', 1)
    # The export intentionally exposes no game-server routes and uses no CDN.
    assert 'await fetch(path, opts)' not in html
    assert '<title>TransVerse</title>' in html
    (OUT / 'index.html').write_text(html)
    (DIST / '.nojekyll').touch()
    shutil.copyfile(ROOT / 'THIRD_PARTY.md', DIST / 'THIRD_PARTY.md')
    print('Built static site:', OUT)
    print('No model requests, secrets, or participant records are used by the page.')


if __name__ == '__main__':
    main()
