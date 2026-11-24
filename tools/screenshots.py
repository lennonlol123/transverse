"""Gameplay screenshots of the local build (2026-11-24). Drives a headless Chrome over the DevTools protocol with
the standard library only (no Playwright), plays the real game in English and saves PNGs.

    python3 tools/screenshots.py [--base http://localhost:8765] [--out ../transverse_shots] [--lang en]

Needs the local preview server (dist/) running. Uses the Chrome for Testing that Playwright cached, or $CHROME.
Developer mode is used to start Universes directly; the run IDs it shows start with DEV-.
"""
import argparse, base64, json, os, random, shutil, socket, struct, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path

CHROME = os.environ.get('CHROME') or str(next(Path.home().glob(
    'Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'), ''))


class WS:
    """Minimal websocket client (text frames, client masking, fragmented and long frames)."""
    def __init__(self, url):
        assert url.startswith('ws://'); host, _, path = url[5:].partition('/')
        h, _, p = host.partition(':')
        self.s = socket.create_connection((h, int(p)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f'GET /{path} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
                        f'Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        buf = b''
        while b'\r\n\r\n' not in buf: buf += self.s.recv(4096)
        self.rest = buf.split(b'\r\n\r\n', 1)[1]

    def _read(self, n):
        while len(self.rest) < n:
            chunk = self.s.recv(1 << 20)
            if not chunk: raise ConnectionError('closed')
            self.rest += chunk
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def send(self, text):
        data = text.encode(); mask = os.urandom(4); n = len(data)
        head = bytes([0x81]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack('>H', n) if n < 65536 else bytes([0x80 | 127]) + struct.pack('>Q', n))
        self.s.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self):
        parts = []
        while True:
            b0, b1 = self._read(2); n = b1 & 0x7F
            if n == 126: n = struct.unpack('>H', self._read(2))[0]
            elif n == 127: n = struct.unpack('>Q', self._read(8))[0]
            payload = self._read(n); parts.append(payload)
            if b0 & 0x80: return b''.join(parts).decode('utf-8', 'replace')


class Page:
    def __init__(self, ws): self.ws, self.n = ws, 0
    def call(self, method, **params):
        self.n += 1; mid = self.n
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == mid:
                if 'error' in msg: raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get('result', {})
    def js(self, expr, timeout=180):
        r = self.call('Runtime.evaluate', expression=f'(async () => {{ {expr} }})()', awaitPromise=True, returnByValue=True, timeout=timeout * 1000)
        if 'exceptionDetails' in r: raise RuntimeError(r['exceptionDetails'].get('exception', {}).get('description', r['exceptionDetails']))
        return r.get('result', {}).get('value')
    def go(self, url, settle=1.5):
        self.call('Page.navigate', url=url); time.sleep(settle)
    def shot(self, path):
        data = self.call('Page.captureScreenshot', format='png', captureBeyondViewport=False)['data']
        Path(path).write_bytes(base64.b64decode(data)); print('saved', path)


HELPERS = r"""
window.__sleep = ms => new Promise(r => setTimeout(r, ms));
window.__idle = async () => { for (let k = 0; k < 200; k++) { await __sleep(50); if (document.getElementById('waiting').hidden) break; } await __sleep(150); };
window.__send = async cmd => { const i = document.getElementById('rawInput'); i.value = cmd; i.dispatchEvent(new Event('input', {bubbles: true})); document.getElementById('rawSubmit').click(); await __idle(); };
window.__note = async (t, wait = 2600) => { const i = document.getElementById('noteInput'); i.value = t; i.dispatchEvent(new Event('input', {bubbles: true})); document.getElementById('noteSubmit').click(); await __sleep(wait); await __idle(); };
window.__cards = () => [...document.querySelectorAll('.card')].filter(c => !c.disabled).map(c => c.textContent.trim().replace(/\(.*$/, ''));
window.__play = async (n) => { for (let k = 0; k < n && document.body.dataset.phase === 'act'; k++) { const c = __cards(); await __send((k % 3 === 2 || !c.length) ? 'END' : c[k % Math.max(1, c.length)]); } };
window.__toNote = async () => { let k = 0; while (document.body.dataset.phase === 'act' && k < 400) { const c = __cards(); await __send((k % 3 === 2 || !c.length) ? 'END' : c[0]); k++; } await __sleep(1500); return document.body.dataset.phase; };
window.__dev = async (u, skip) => { window.confirm = () => true; await __sleep(800); document.getElementById('devUniverse').value = String(u); document.getElementById('devSkip').checked = !!skip; document.getElementById('devStart').click(); };
"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://localhost:8765'); ap.add_argument('--out', default=str(Path(__file__).resolve().parents[2] / 'transverse_shots')); ap.add_argument('--lang', default='en')
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    if not Path(CHROME).exists(): sys.exit('No Chrome found; set CHROME=/path/to/chrome')
    port = random.randint(9300, 9600); prof = tempfile.mkdtemp(prefix='tv-shots-')
    proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', '--no-first-run',
                             '--hide-scrollbars', '--window-size=1440,900', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try: targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
            except Exception: time.sleep(0.1)
        page_t = next(t for t in targets if t['type'] == 'page')
        p = Page(WS(page_t['webSocketDebuggerUrl']))
        p.call('Page.enable'); p.call('Runtime.enable')
        p.call('Emulation.setDeviceMetricsOverride', width=1440, height=900, deviceScaleFactor=2, mobile=False)
        B, L = a.base, a.lang
        q = f'?lang={L}'
        n = iter(range(1, 100)); name = lambda s: out / f'{next(n):02d}-{s}.png'

        # Outer pages.
        p.go(f'{B}/', 4.5); p.shot(name('portal'))
        p.go(f'{B}/welcome.html', 2.5); p.shot(name('welcome'))
        p.go(f'{B}/how-it-works.html', 2.5); p.shot(name('how-it-works'))

        # First entry: consent page, then the stage and the door into Universe I.
        p.go(f'{B}/play/{q}', 2); p.js(HELPERS); p.shot(name('consent'))
        p.js("document.getElementById('demoAdult').click(); document.getElementById('demoAgree').click(); document.getElementById('demoNew').click();")
        p.js("for (let k = 0; k < 600; k++) { await __sleep(50); const s = document.getElementById('threshold'); if (s.classList.contains('th-ready') && !document.getElementById('thresholdOpen').disabled) break; } await __sleep(900);")
        p.shot(name('stage-universe-1'))
        p.js("document.getElementById('thresholdOpen').click(); await __sleep(1900);"); p.shot(name('door-opening'))
        p.js("for (let k = 0; k < 200; k++) { await __sleep(50); if (!document.body.classList.contains('tv-reveal') && document.getElementById('threshold').hidden) break; } await __sleep(800);")
        p.shot(name('camp'))
        # Universe I, first Encounter, a few moves in.
        p.js("await __send('LEAVE'); await __sleep(1500); if (document.body.dataset.phase === 'note') await __note('Camp: doln seems to deal damage; tsun might guard.'); await __sleep(3200);")
        p.shot(name('encounter-start'))
        p.js("await __play(5); await __sleep(900);"); p.shot(name('encounter-midway'))
        p.js("const ph = await __toNote(); await __sleep(1200); const i = document.getElementById('noteInput'); i.value = 'The second block in a row made its next strike land harder. Try striking first next time.'; i.dispatchEvent(new Event('input', {bubbles: true})); await __sleep(400);")
        p.shot(name('record-sheet'))

        # Between Universes: Universe III entered from the stage (two doors already crossed on the wall).
        p.go(f'{B}/play/{q}&dev=1', 2); p.js(HELPERS)
        p.js("await __dev(3, false); for (let k = 0; k < 600; k++) { await __sleep(50); const s = document.getElementById('threshold'); if (s.classList.contains('th-ready') && !document.getElementById('thresholdOpen').disabled) break; } await __sleep(900);")
        p.shot(name('stage-universe-3'))
        p.js("document.getElementById('thresholdOpen').click(); await __sleep(1100);"); p.shot(name('door-open-light'))
        p.js("for (let k = 0; k < 200; k++) { await __sleep(50); if (!document.body.classList.contains('tv-reveal') && document.getElementById('threshold').hidden) break; } await __sleep(600); await __send('LEAVE'); await __sleep(1500); if (document.body.dataset.phase === 'note') await __note('Camp notes.'); await __sleep(3200); await __play(4); await __sleep(900);")
        p.shot(name('encounter-universe-3'))

        # Other worlds, straight into their first Encounter.
        for u in (2, 4, 5):
            p.go(f'{B}/play/{q}&dev=1', 2); p.js(HELPERS)
            p.js(f"await __dev({u}, true); for (let k = 0; k < 200; k++) {{ await __sleep(100); if (document.body.dataset.phase === 'act') break; }} await __sleep(900);"
                 "if (document.querySelector('.idol.training-post')) { await __send('LEAVE'); await __sleep(1500); if (document.body.dataset.phase === 'note') await __note('Camp notes.'); }"
                 "await __sleep(3200); await __play(3); await __sleep(900);")
            p.shot(name(f'encounter-universe-{u}'))
    finally:
        proc.terminate(); shutil.rmtree(prof, ignore_errors=True)


if __name__ == '__main__':
    main()
