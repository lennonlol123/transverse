/* Local transport only. The original GUI still renders and submits each prompt. */
(() => {
  'use strict';
  const VERSION = 'public-browser-demo-v1';
  const INTERFACE = 'transverse-white-v6';
  const CONSENT = 'transverse-consent-1';
  const DB = 'transverse-v1';
  const PLAYED = 'tv-has-played-v1';
  const newRunId = () => {
    const bytes = new Uint8Array(6); crypto.getRandomValues(bytes);
    return 'TV-' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const readFlag = () => { try { return localStorage.getItem(PLAYED) === '1'; } catch (_) { return false; } };
  const writeFlag = () => { try { localStorage.setItem(PLAYED, '1'); } catch (_) {} };
  const I18N = window.TVi18n || {lang: 'en', t: x => x, fmt: null, apply() {}, switchTo() {}};
  const T = text => I18N.t(text);
  const notice = text => { const el = document.getElementById('demoMessage'); if (el) el.textContent = T(text); };
  // Developer mode (play/?dev=1): start any Universe directly; runs are marked DEV everywhere.
  const DEV = new URLSearchParams(location.search).has('dev');
  let game = null, snapshot = null, stopped = false, busy = false, worker = null, serial = 0;
  const waiters = new Map();
  const storage = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function stored(value) {
    const db = await storage;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', value === undefined ? 'readonly' : 'readwrite');
      const store = tx.objectStore('saves');
      const req = value === undefined ? store.get('current') : store.put(value, 'current');
      let result;
      req.onsuccess = () => { result = req.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Could not save progress. Export a backup.'));
      tx.onabort = () => reject(tx.error || new Error('Storage is full. Export a backup.'));
    });
  }
  function compute(payload) {
    if (!worker) {
      worker = new Worker(new URL('src/engine-worker.mjs', document.baseURI), {type:'module'});
      worker.onmessage = ({data}) => {
        if (data.progress) { notice(data.progress); return; }
        const waiter = waiters.get(data.id); if (!waiter) return;
        waiters.delete(data.id);
        data.error ? waiter.reject(new Error(data.error)) : waiter.resolve(data.result);
      };
      worker.onerror = () => {
        for (const pending of waiters.values()) pending.reject(new Error('The game runtime could not load. Reload to restore the last confirmed input.'));
        waiters.clear(); worker.terminate(); worker = null;
      };
    }
    return new Promise((resolve, reject) => { const id = ++serial; waiters.set(id, {resolve,reject}); worker.postMessage({id,payload}); });
  }
  function payload(value = game) { return {universe:value.universe, actions:value.actions, baseline:value.baseline, ...(value.dev ? {dev:true} : {})}; }
  function sync() {
    document.getElementById('demoContinue').hidden = !game;
    document.getElementById('demoNew').textContent = T(game ? 'New playthrough' : 'Start playing');
    const next = document.getElementById('demoNext');
    next.hidden = !snapshot?.complete || game?.universe === 5;
    next.textContent = game ? (I18N.fmt ? I18N.fmt.next(game.universe + 1) : 'Continue to Universe ' + (game.universe + 1)) : T('Continue');
    const position = document.getElementById('demoPosition');
    position.textContent = game ? (I18N.fmt ? I18N.fmt.position(game.runId || 'TV-LOCAL', game.universe) : `${game.runId || 'TV-LOCAL'} · Universe ${game.universe} of 5 · Episodes 4`) : 'TransVerse';
    const jump = document.getElementById('devJump'); if (jump) jump.hidden = !(DEV || game?.dev);
    document.getElementById('demoRunId').textContent = game?.runId || '–';
    document.getElementById('demoInterface').textContent = game?.interface || INTERFACE;
    document.getElementById('demoFinish').hidden = !(snapshot?.complete && game?.universe === 5);
  }
  async function run(candidate) {
    const result = await compute(payload(candidate));
    // Persist the acknowledged action before showing its consequences.
    await stored(candidate);
    game = candidate; snapshot = result; stopped = false; notice(''); sync();
    if (snapshot?.complete && game.universe === 5 && !game.finaleShown) {
      game = {...game, finaleShown: true};
      await stored(game);
      finale();
    }
  }
  async function launch(newGame = false, explicitCandidate = null, confirmed = false) {
    if (busy) return;
    if (newGame && game && !confirmed && !confirm(T('Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.'))) return;
    busy = true;
    try {
      const fresh = () => {
        const firstPlaythrough = !game && !readFlag();
        writeFlag();
        return {version:VERSION, interface:INTERFACE, runId:newRunId(), firstPlaythrough,
          consent:{version:CONSENT, adult:true, agreed:true, at:new Date().toISOString()}, lang:I18N.lang,
          universe:1, actions:[], baseline:{}, history:[], startedAt:new Date().toISOString()};
      };
      const candidate = explicitCandidate || (newGame || !game ? fresh() : game);
      notice('Preparing your game… The first load downloads the browser runtime.');
      await run(candidate);
      document.getElementById('demoWelcome').hidden = true;
      document.getElementById('name').value = 'Player';
      document.getElementById('lives').value = '1-4';
      document.getElementById('reveal').checked = false;
      // Reuse the existing client start/reset path, without a network server.
      document.getElementById('start').click();
    } catch (error) { notice(error.message); }
    finally { busy = false; }
  }
  function exportSave() {
    if (!game) throw new Error('There is no saved game yet.');
    const data = {title:'TransVerse', condition:VERSION, interface:game.interface || INTERFACE, savedAt:new Date().toISOString(),
      ...game, records:snapshot?.files || game.baseline};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = `transverse-${game.runId || 'local'}-u${game.universe}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    return {message:'Save downloaded to your device.'};
  }
  // Threshold stage: the story between Universes. Beats (each marks a change, none says how the game works):
  // the front curtain rises (first entrance only); the traveller walks on and stops; from Universe II on they
  // seal the letter with the colour of the Universe just left; they look at the letter; the gap of the door
  // lights; the player opens the door and the traveller walks through. The doors standing upstage are the Universes already crossed. After Universe V: the finale.
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const HUE = ['#4F8A5B', '#D2442A', '#3D6496', '#B8902F', '#2E86C8'];
  const SVGNS = 'http://www.w3.org/2000/svg';
  // Reduced motion: the system setting, or the player's own switch under SHOW (kept in this browser).
  const MOTION_KEY = 'tv-motion';
  const motionOff = () => { try { return localStorage.getItem(MOTION_KEY) === 'off'; } catch (_) { return false; } };
  document.documentElement.classList.toggle('tv-reduced', motionOff());
  const REDUCE = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('tv-reduced');
  // Button -> door: the rectangle of the button the player pressed grows into the frame of the stage door,
  // then the stage opens around it. About 0.9 s; a click or a key finishes it at once.
  function morph(from) {
    if (REDUCE() || !from) return Promise.resolve();
    const r = from.getBoundingClientRect();
    const W = innerWidth, H = innerHeight, k = Math.max(W / 1440, H / 900);
    const ox = (W - 1440 * k) / 2, oy = (H - 900 * k) / 2;
    const box = document.createElement('div'); box.className = 'tv-morph';
    document.body.append(box);
    const welcome = document.getElementById('demoWelcome'); welcome.classList.add('tv-leaving');
    const anim = box.animate([
      {left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderWidth: '2px'},
      {left: (1086 * k + ox) + 'px', top: (384 * k + oy) + 'px', width: (146 * k) + 'px', height: (446 * k) + 'px', borderWidth: Math.max(3, 8 * k) + 'px', borderColor: '#5E5A55'}],
      {duration: 600, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards'});
    const skip = () => anim.finish();
    addEventListener('pointerdown', skip, {once: true}); addEventListener('keydown', skip, {once: true});
    return anim.finished.catch(() => {}).then(() => {
      removeEventListener('pointerdown', skip); removeEventListener('keydown', skip);
      return box;
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, REDUCE() ? 0 : ms));
  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.append(node);
    return node;
  }
  function smallDoor(parent, x, base, w, h, universe, cls) {
    const g = el('g', {class: cls}, parent);
    const id = `thClip${cls}${universe}`;
    const clip = el('clipPath', {id}, g); el('rect', {x, y: base - h, width: w, height: h}, clip);
    el('rect', {x: x - 14, y: base - h - 14, width: w + 28, height: h + 14, fill: '#E2DED6'}, g);
    el('rect', {x, y: base - h, width: w, height: h, fill: '#2E2B28'}, g);
    el('image', {href: `art/u${universe}-scene.webp`, x: x - w, y: base - h, width: w * 3, height: h, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})`, class: cls + '-art'}, g);
    el('rect', {x: x - 2, y: base - h, width: 7, height: h, fill: HUE[universe - 1], filter: 'url(#thSoft)', class: cls + '-glow'}, g);
    el('path', {d: `M${x - 4} ${base} V${base - h - 4} H${x + w + 4} V${base}`, fill: 'none', stroke: '#5E5A55', 'stroke-width': 6}, g);
    return g;
  }
  function journeyMarks(crossed, fresh) {
    const past = document.getElementById('thPast');
    past.replaceChildren();
    // The poster shows no past doors; the label in the corner counts the Universes.
  }
  async function stageIn(stage, first) {
    stage.classList.remove('is-open', 'th-ready', 'th-walkin', 'th-walking', 'th-look', 'th-sealed', 'th-curtain-up', 'th-lit');
    stage.classList.toggle('th-curtain-down', first);
    stage.classList.add('th-pre');
    stage.hidden = false;
    void stage.getBoundingClientRect();
    if (first) { await wait(500); stage.classList.add('th-curtain-up'); await wait(1300); }
    stage.classList.add('th-walkin', 'th-walking');
    await wait(1250);
    stage.classList.remove('th-walking');
  }
  // The doorway's rectangle on screen (stage viewBox 1440 × 900, xMidYMid slice; opening 1094–1224 × 392–830).
  function doorway() {
    const W = innerWidth, H = innerHeight, k = Math.max(W / 1440, H / 900);
    const ox = (W - 1440 * k) / 2, oy = (H - 900 * k) / 2;
    return {left: 1094 * k + ox, top: 392 * k + oy, right: 1224 * k + ox, bottom: 830 * k + oy};
  }
  // Wait until the game shows the given Universe (welcome closed, a screen drawn), at most 10 s.
  async function drawn(universe) {
    for (let i = 0; i < 100; i++) {
      const b = document.body;
      if (document.getElementById('demoWelcome').hidden && b.dataset.universe === String(universe)
          && ['act', 'note', 'pick'].includes(b.dataset.phase)) { await new Promise(r => setTimeout(r, 120)); return true; }
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }
  async function threshold(universe, opts = {}) {
    const stage = document.getElementById('threshold');
    if (!stage) return;
    const crossed = universe - 1;
    stage.classList.remove('th-finale-mode');
    document.getElementById('thEnd').hidden = true;
    document.getElementById('thFinale').replaceChildren();
    stage.dataset.next = String(universe);
    document.getElementById('thresholdTitle').textContent = I18N.fmt ? I18N.fmt.where(universe) : `UNIVERSE 0${universe} / 05`;
    document.getElementById('thNextArt').setAttribute('href', `art/u${universe}-scene.webp`);
    document.getElementById('thSeal').setAttribute('fill', crossed ? HUE[crossed - 1] : 'none');
    journeyMarks(crossed, true);
    const button = document.getElementById('thresholdOpen');
    button.disabled = true;
    if (opts.morph) {
      stage.classList.add('th-fadein'); stage.hidden = false; void stage.getBoundingClientRect();
      stage.classList.remove('th-fadein');
      opts.morph.classList.add('tv-morph-out'); setTimeout(() => opts.morph.remove(), 600);
      document.getElementById('demoWelcome').classList.remove('tv-leaving');
    }
    await stageIn(stage, universe === 1 && !opts.morph);
    if (crossed) { stage.classList.add('th-sealed'); await wait(500); }
    stage.classList.add('th-look'); await wait(800);
    stage.classList.add('th-ready');
    button.disabled = false; button.focus();
    await new Promise(resolve => { button.onclick = resolve; });
    button.disabled = true;
    stage.classList.add('is-open', 'th-walking');
    await wait(1250);
    if (opts.until) await opts.until;      // the next Universe is computed while the stage plays
    // One shot from here into the Universe: once its first screen is drawn, the scene box opens out of the
    // doorway (skin-adapter fromDoor), and the stage is hidden behind it.
    const shown = await drawn(universe);
    if (shown && window.TVSkins && TVSkins.fromDoor) await TVSkins.fromDoor(doorway(), universe, () => { stage.hidden = true; });
    stage.hidden = true;
    stage.classList.remove('th-walking');
  }
  async function finale() {
    const stage = document.getElementById('threshold');
    if (!stage) return;
    stage.classList.add('th-finale-mode');
    stage.dataset.next = '5';
    document.getElementById('thresholdTitle').textContent = I18N.fmt ? I18N.fmt.where(5) : 'UNIVERSE 05 / 05';
    document.getElementById('thSeal').setAttribute('fill', HUE[4]);
    journeyMarks(5, false);
    const doors = document.getElementById('thFinale');
    doors.replaceChildren();
    [230, 460, 690, 920, 1150].forEach((x, i) => {
      const g = smallDoor(doors, x, 830, 96, 330, i + 1, 'th-fdoor');
      g.querySelector('.th-fdoor-art').style.transitionDelay = g.querySelector('.th-fdoor-glow').style.transitionDelay = (i * 0.55) + 's';
    });
    document.getElementById('thEnd').hidden = false;
    document.getElementById('thresholdOpen').disabled = true;
    await stageIn(stage, false);
    stage.classList.add('th-sealed', 'th-lit');
    await wait(3600);
    stage.classList.remove('th-curtain-up');
    stage.classList.add('th-curtain-down');
    await new Promise(resolve => {
      document.getElementById('thExport').onclick = () => { try { exportSave(); } catch (e) { notice(e.message); } };
      document.getElementById('thClose').onclick = resolve;
    });
    stage.hidden = true;
    stage.classList.remove('th-finale-mode', 'th-curtain-down');
  }
  window.TVStage = {threshold, finale};
  window.TVLocal = {
    runId: () => game?.runId || null,
    async request(path, body) {
      await initialized;
      if (path.startsWith('/api/state')) {
        const after = Number(new URL(path,'https://local.invalid').searchParams.get('after') || 0);
        const pack = 'Universe ' + (game?.universe || 1);
        const packs = [1,2,3,4,5].map(n => 'Universe ' + n);
        return {status:stopped?'stopped':snapshot?(snapshot.complete?'complete':'running'):'idle',
          name:game?'Player':'', pack, packs, pack_sizes:Object.fromEntries(packs.map(p => [p,4])),
          config:{lives:'1-4',carry:'notes',reveal:false}, prompt_id:stopped?null:snapshot?.prompt_id ?? null,
          events:stopped?[]:(snapshot?.events || []).filter(e => e.id > after)};
      }
      if (path === '/api/start') {
        if (!snapshot) throw new Error('Use Start playing on the welcome screen.');
        stopped = false; return {ok:true};
      }
      if (path === '/api/input') {
        if (busy || stopped || !snapshot || snapshot.complete || body.prompt_id !== snapshot.prompt_id) throw new Error('This input is no longer current. Wait for the current screen.');
        busy = true;
        try {
          await run({...game, actions:[...game.actions,String(body.value)]});
          return {ok:true};
        } finally { busy = false; }
      }
      if (path === '/api/stop') {
        stopped = true;
        document.getElementById('demoWelcome').hidden = false;
        notice('Progress saved. You may close this tab or continue.'); sync(); return {ok:true};
      }
      if (path === '/api/export') return exportSave();
      throw new Error('Unknown local game operation.');
    },
  };
  const initialized = (async () => {
    try { const saved = await stored(); if (saved?.version === VERSION) game = saved; }
    catch (_) { notice('Browser storage is unavailable. Allow site storage to play and save your progress.'); }
    sync();
  })();
  document.addEventListener('DOMContentLoaded', () => {
    const adult = document.getElementById('demoAdult'), agree = document.getElementById('demoAgree');
    const gate = () => { document.getElementById('demoNew').disabled = !(adult.checked && agree.checked); };
    adult.onchange = gate; agree.onchange = gate; gate();
    document.getElementById('demoNew').onclick = async () => {
      if (!(adult.checked && agree.checked)) return;
      if (game && !confirm(T('Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.'))) return;
      const box = await morph(document.getElementById('demoNew'));
      let ready; const until = new Promise(r => { ready = r; });
      threshold(1, {morph: box || null, until});
      await launch(true, null, true); ready();
    };
    const motionButton = document.getElementById('demoMotion');
    const showMotion = () => { motionButton.textContent = T('Motion: ' + (motionOff() ? 'reduced' : 'on')); };
    motionButton.onclick = () => {
      try { localStorage.setItem(MOTION_KEY, motionOff() ? 'on' : 'off'); } catch (_) {}
      document.documentElement.classList.toggle('tv-reduced', motionOff()); showMotion();
    };
    showMotion();
    // Language: the consent page link and the SHOW panel button switch between English and Chinese.
    const other = I18N.lang === 'zh' ? 'en' : 'zh';
    for (const id of ['demoLang', 'demoLangSwitch']) {
      const el = document.getElementById(id); if (!el) continue;
      el.textContent = other === 'zh' ? '中文' : 'EN';
      el.onclick = event => { event.preventDefault(); I18N.switchTo(other); };
    }
    document.getElementById('demoShow').textContent = T('Show');
    document.querySelector('.demo-head .demo-link[href="../how-it-works.html"]')?.setAttribute('href', I18N.lang === 'zh' ? '../zh/how-it-works.html' : '../how-it-works.html');
    document.querySelector('.demo-head .demo-mark')?.setAttribute('href', I18N.lang === 'zh' ? '../zh/' : '../');
    // Developer mode.
    const devRun = async (universe, skipDoor) => {
      if (busy) return;
      if (game && !confirm(T('Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.'))) return;
      const bytes = new Uint8Array(4); crypto.getRandomValues(bytes);
      const candidate = {version:VERSION, interface:INTERFACE, runId:'DEV-' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase(),
        dev:true, firstPlaythrough:false, consent:null, lang:I18N.lang, universe, actions:[], baseline:{}, history:[], startedAt:new Date().toISOString()};
      if (skipDoor) { await launch(true, candidate, true); return; }
      let ready; const until = new Promise(r => { ready = r; });
      threshold(universe, {until});
      await launch(true, candidate, true); ready();
    };
    if (DEV) {
      document.getElementById('devBox').hidden = false;
      document.getElementById('devStart').onclick = () => devRun(Number(document.getElementById('devUniverse').value), document.getElementById('devSkip').checked);
    }
    document.getElementById('devJumpGo').onclick = () => devRun(Number(document.getElementById('devJumpUniverse').value), true);
    document.getElementById('demoShow').onclick = event => {
      const details = document.getElementById('demoDetails');
      details.hidden = !details.hidden;
      event.currentTarget.textContent = T(details.hidden ? 'Show' : 'Hide');
      event.currentTarget.setAttribute('aria-expanded', String(!details.hidden));
    };
    document.getElementById('demoContinue').onclick = () => launch();
    document.getElementById('demoBackup').onclick = () => { try { exportSave(); } catch(e) { notice(e.message); } };
    document.getElementById('demoNext').onclick = async () => {
      if (busy || !snapshot?.complete || game.universe >= 5) return;
      const candidate = {...game, universe:game.universe+1, actions:[], baseline:snapshot.files,
        history:[...game.history,{universe:game.universe,actions:game.actions}]};
      let ready; const until = new Promise(r => { ready = r; });
      threshold(candidate.universe, {until});
      await launch(false, candidate); ready();
    };
  });
})();
