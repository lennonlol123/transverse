/* Local transport only. The original GUI still renders and submits each prompt. */
(() => {
  'use strict';
  const VERSION = 'public-browser-demo-v1';
  const INTERFACE = 'transverse-white-v2';
  const CONSENT = 'transverse-consent-1';
  const DB = 'transverse-v1';
  const PLAYED = 'tv-has-played-v1';
  const newRunId = () => {
    const bytes = new Uint8Array(6); crypto.getRandomValues(bytes);
    return 'TV-' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const readFlag = () => { try { return localStorage.getItem(PLAYED) === '1'; } catch (_) { return false; } };
  const writeFlag = () => { try { localStorage.setItem(PLAYED, '1'); } catch (_) {} };
  const notice = text => { const el = document.getElementById('demoMessage'); if (el) el.textContent = text; };
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
  function payload(value = game) { return {universe:value.universe, actions:value.actions, baseline:value.baseline}; }
  function sync() {
    document.getElementById('demoContinue').hidden = !game;
    document.getElementById('demoNew').textContent = game ? 'New playthrough' : 'Start playing';
    const next = document.getElementById('demoNext');
    next.hidden = !snapshot?.complete || game?.universe === 5;
    next.textContent = game ? 'Continue to Universe ' + (game.universe + 1) : 'Continue';
    const position = document.getElementById('demoPosition');
    position.textContent = game ? `${game.runId || 'TV-LOCAL'} · Universe ${game.universe} of 5 · Episodes 4` : 'TransVerse';
    document.getElementById('demoRunId').textContent = game?.runId || '–';
    document.getElementById('demoInterface').textContent = game?.interface || INTERFACE;
    document.getElementById('demoFinish').hidden = !(snapshot?.complete && game?.universe === 5);
  }
  async function run(candidate) {
    const result = await compute(payload(candidate));
    // Persist the acknowledged action before showing its consequences.
    await stored(candidate);
    game = candidate; snapshot = result; stopped = false; notice(''); sync();
  }
  async function launch(newGame = false, explicitCandidate = null, confirmed = false) {
    if (busy) return;
    if (newGame && game && !confirmed && !confirm('Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.')) return;
    busy = true;
    try {
      const fresh = () => {
        const firstPlaythrough = !game && !readFlag();
        writeFlag();
        return {version:VERSION, interface:INTERFACE, runId:newRunId(), firstPlaythrough,
          consent:{version:CONSENT, adult:true, agreed:true, at:new Date().toISOString()},
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
  // Threshold: shown before entering a Universe. Resolves when the player opens the door.
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  function threshold(universe) {
    const stage = document.getElementById('threshold');
    if (!stage) return Promise.resolve();
    stage.dataset.next = String(universe);
    stage.classList.remove('is-open');
    document.getElementById('thresholdTitle').textContent = 'Universe ' + ROMAN[universe - 1];
    document.getElementById('thNextArt').setAttribute('href', `art/u${universe}-scene.webp`);
    const button = document.getElementById('thresholdOpen');
    button.disabled = false;
    stage.hidden = false;
    button.focus();
    return new Promise(resolve => {
      button.onclick = () => {
        button.disabled = true;
        stage.classList.add('is-open');
        const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => { stage.hidden = true; resolve(); }, reduce ? 0 : 1900);
      };
    });
  }
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
      if (game && !confirm('Start a new playthrough? This replaces the saved playthrough on this browser. Export it first if you want to keep it.')) return;
      await threshold(1);
      launch(true, null, true);
    };
    document.getElementById('demoShow').onclick = event => {
      const details = document.getElementById('demoDetails');
      details.hidden = !details.hidden;
      event.currentTarget.textContent = details.hidden ? 'Show' : 'Hide';
      event.currentTarget.setAttribute('aria-expanded', String(!details.hidden));
    };
    document.getElementById('demoContinue').onclick = () => launch();
    document.getElementById('demoBackup').onclick = () => { try { exportSave(); } catch(e) { notice(e.message); } };
    document.getElementById('demoNext').onclick = async () => {
      if (busy || !snapshot?.complete || game.universe >= 5) return;
      const candidate = {...game, universe:game.universe+1, actions:[], baseline:snapshot.files,
        history:[...game.history,{universe:game.universe,actions:game.actions}]};
      await threshold(candidate.universe);
      await launch(false, candidate);
    };
  });
})();
