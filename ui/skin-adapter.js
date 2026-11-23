/* Only opaque cosmetic coordinates and already-public labels enter this module.
 * Interface version: transverse-white-v6 (v2 = v1 + change-only motion, input held in place while computing;
 * v3 = v2 + fixed panel heights, centred opponent, darker secondary text #716E68, Space Grotesk for buttons and labels;
 * v4 = v3 + a letterboxed reveal on the first Encounter of each Universe, input inert until the panels return;
 * v5 = v4 + between Encounters the prompt sits above the note field (same words), the opponent leaves, note field focused;
 * v6 = v5 + notes between Encounters are written on a record sheet that unfolds from the Record and files back).
 * - Each Universe has one painting and one opponent figure. The same figure stands in
 *   every Encounter of that Universe, so appearance can never covary with a mechanism.
 * - Each card shows an abstract sign. Signs are bound to card NAMES (never to what a
 *   card does), in order of first sight, from a per-Universe shuffle of the sign set. */
(function () {
  'use strict';
  const worlds = __TV_PUBLIC_ART__;
  // Display-only renaming (World/Life/fight/layer -> Universe/Episode/Encounter), the same
  // table as the research interface. Records keep the original words.
  const terms = __TV_TERMS__.map(([pattern, replacement]) => [new RegExp(pattern, 'g'), replacement]);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT']);
  function rename(text) {
    for (const [pattern, replacement] of terms) {
      text = text.replace(pattern, (...m) => replacement.replace(/\{(\d)\}/g, (_, i) => m[Number(i)]));
    }
    return text;
  }
  function renameNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentElement && SKIP.has(node.parentElement.tagName)) return;
      if (node.parentElement && node.parentElement.closest('.demo-welcome,.demo-navigation,.demo-details')) return;
      const value = node.nodeValue, renamed = rename(value);
      if (renamed !== value) node.nodeValue = renamed;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || SKIP.has(node.tagName)) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(renameNode);
  }
  // Trail mark: one per Encounter already played in this Episode. Neutral, the same everywhere.
  const MARK = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="11" fill="#FFFFFF" fill-opacity=".92" stroke="#161616" stroke-width="3"/></svg>');
  const INTERFACE = 'transverse-white-v6';
  let context = {universe:1, episode:1, encounter:0};
  const classes = [
    ['.bevel,.hud,.tray,.hud-side,.hud-turn', 'tv-panel'],
    ['.key', 'tv-button'], ['input,select,textarea,.raw-form', 'tv-field'],
    ['.choice', 'tv-card'], ['.viewport', 'tv-scene'],
    ['.hud-name,.plate-text', 'tv-tag'], ['.transcript', 'tv-record'],
    ['.slot,.hud-turn-n,.card-name,.card-mark,.note-input', 'tv-value'],
    ['.wordmark,.title-word', 'tv-display']
  ];

  // Abstract signs, 48 × 48, drawn in the Universe accent. None depicts an object,
  // a body part, an arrow, a weapon, a container or an arithmetic sign.
  const S = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="currentColor"';
  const SIGNS = [
    `<circle cx="22" cy="26" r="13" ${S}/><circle cx="35" cy="12" r="4" ${F}/>`,
    `<path d="M24 8 L40 37 L8 37 Z" ${S}/><path d="M24 25 L29 33 L19 33 Z" ${F}/>`,
    `<rect x="9" y="9" width="30" height="30" rx="2" ${S}/><path d="M16 31 L23 17 M23 31 L30 17" ${S}/>`,
    `<path d="M24 6 L42 24 L24 42 L6 24 Z" ${S}/><circle cx="24" cy="24" r="3.4" ${F}/><circle cx="24" cy="14.5" r="2.2" ${F}/>`,
    `<circle cx="18" cy="24" r="11" ${S}/><circle cx="30" cy="24" r="11" ${S}/>`,
    `<circle cx="24" cy="24" r="15" ${S}/><path d="M24 9 A15 15 0 0 0 24 39 Z" ${F}/>`,
    `<circle cx="24" cy="12" r="4.2" ${F}/><circle cx="13" cy="33" r="4.2" ${F}/><circle cx="35" cy="33" r="4.2" ${F}/><path d="M24 12 L13 33 L35 33 Z" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".45"/>`,
    `<rect x="8" y="8" width="32" height="32" rx="2" ${S}/><rect x="25" y="25" width="10" height="10" rx="1" ${F}/><path d="M8 24 H24 V8" ${S}/>`,
  ];
  function hash32(text) {
    let h = 0x811c9dc5;
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
    return h >>> 0;
  }
  function order(universe) {
    const out = SIGNS.map((_, i) => i);
    let s = hash32('transverse-signs|' + universe) || 1;
    for (let i = out.length - 1; i > 0; i--) {
      s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) >>> 0; s = (s ^ (s >>> 12)) >>> 0;
      const j = s % (i + 1); [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const memory = {};
  function signFor(name) {
    const run = (window.TVLocal && window.TVLocal.runId && window.TVLocal.runId()) || 'local';
    const key = `tv-signs-v1:${run}:${context.universe}`;
    let table = memory[key];
    if (!table) { try { table = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { table = {}; } memory[key] = table; }
    if (!(name in table)) {
      table[name] = Object.keys(table).length % SIGNS.length;
      try { localStorage.setItem(key, JSON.stringify(table)); } catch (_) {}
    }
    return SIGNS[order(context.universe)[table[name]]];
  }
  function paintCards() {
    const hands = document.querySelectorAll('#choices');
    for (const hand of hands) {
      // Bind first-seen names in alphabetical order within the hand, so the order of
      // the draw never decides which sign a card receives.
      const cards = [...hand.querySelectorAll('.hand-card')];
      const names = cards.map(c => (c.querySelector('.card-name') || {}).textContent || '').map(s => s.trim());
      [...new Set(names)].filter(Boolean).sort().forEach(signFor);
      cards.forEach((card, i) => {
        const art = card.querySelector('.card-art');
        const name = names[i];
        if (!art || !name) return;
        const tag = `${context.universe}:${name}`;
        if (art.dataset.sign === tag) return;
        art.dataset.sign = tag;
        art.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${signFor(name)}</svg>`;
      });
    }
  }

  function world() { return worlds.find(w => w.universe === context.universe) || worlds[0]; }
  function placeRunBar() {
    const bar = document.querySelector('.demo-navigation');
    const top = document.querySelector('.shell > .topbar');
    if (bar && top && top.nextElementSibling !== bar) top.after(bar);
    const details = document.getElementById('demoDetails');
    if (details && bar && bar.nextElementSibling !== details) bar.after(details);
  }
  function decorate() {
    for (const node of document.querySelectorAll('.wordmark,.title-word')) {
      if (node.textContent !== 'TransVerse') node.textContent = 'TransVerse';
    }
    for (const [selector, name] of classes) {
      for (const node of document.querySelectorAll(selector)) {
        if (!node.classList.contains(name)) node.classList.add(name);
      }
    }
    for (const button of document.querySelectorAll('#commands button')) {
      if (button.textContent.trim().toUpperCase() === 'END' && !button.classList.contains('tv-end')) button.classList.add('tv-end');
    }
    document.body.dataset.universe = String(context.universe);
    document.body.dataset.episode = String(context.episode);
    document.body.dataset.encounter = String(context.encounter);
    document.body.dataset.interface = INTERFACE;
    placeRunBar();
    const dialogue = document.getElementById('context');
    const journal = document.querySelector('.journal');
    const transcript = document.getElementById('transcript');
    const phase = document.body.dataset.phase;
    const inEncounter = phase === 'act';
    // Between Encounters (notes, choices) the same text sits right above the answer field, whole and
    // readable, instead of over a small painting; the words are unchanged.
    const between = phase === 'note' || phase === 'pick';
    const tray = document.getElementById('inputArea');
    if (dialogue && journal && transcript) {
      dialogue.classList.toggle('tv-feedback', inEncounter);
      dialogue.classList.toggle('tv-between', between);
      if (inEncounter && dialogue.parentElement !== journal) journal.insertBefore(dialogue, transcript);
      if (between && tray && dialogue.parentElement !== tray) tray.prepend(dialogue);
      if (!inEncounter && !between && dialogue.parentElement !== document.getElementById('viewport')) document.getElementById('viewport').append(dialogue);
      dialogue.setAttribute('aria-label', inEncounter ? 'Latest feedback' : 'Context');
    }
    endOfEncounter(phase);
    sheet(phase);
    focusNote(phase);
    const viewport = document.getElementById('viewport');
    if (viewport) {
      const value = 'url("' + world().scene + '")';
      if (viewport.style.backgroundImage !== value) viewport.style.backgroundImage = value;
    }
    story(viewport);
    const host = document.getElementById('idol');
    if (host && !host.hidden && !host.classList.contains('training-post')) {
      // One persistent, already-decoded image per Universe: the GUI redraws the figure host on
      // every update, and a fresh <img> would blank for a frame.
      const image = opponentImage();
      if (host.firstChild !== image || host.childNodes.length !== 1) host.replaceChildren(image);
    }
    paintCards();
    holdInput();
    motion();
  }
  const opponents = {};
  function opponentImage() {
    const u = String(context.universe);
    if (!opponents[u]) {
      const image = document.createElement('img'); image.className = 'tv-monster';
      image.src = world().opponent; image.alt = ''; image.setAttribute('aria-hidden', 'true'); image.decoding = 'sync';
      image.dataset.universe = u; opponents[u] = image;
    }
    return opponents[u];
  }

  // While the engine computes the next state (a few hundred ms in the browser) the GUI swaps the
  // whole input area for a WAIT row, and the scene jumps taller and back. Keep the area in place,
  // unchanged and inert, until the next prompt arrives; the status lamp already says it is busy.
  let held = null;
  function holdInput() {
    const waiting = document.getElementById('waiting');
    const action = document.getElementById('actionInput'), note = document.getElementById('noteForm');
    if (!waiting || !action || !note) return;
    if (!waiting.hidden && action.hidden && note.hidden) {
      if (!held && lastShown) { held = lastShown; held.classList.add('tv-hold'); held.inert = true; waiting.classList.add('tv-hold-wait'); }
    } else if (held) {
      held.classList.remove('tv-hold'); held.inert = false; held = null; waiting.classList.remove('tv-hold-wait');
    }
    if (!action.hidden) lastShown = action; else if (!note.hidden) lastShown = note;
  }
  let lastShown = null;

  // Motion only marks change (hand-over rule 9): a value that changed, a card newly in hand,
  // an opponent arriving, a new trail mark. The same quiet mark for every change, rising or
  // falling, good or bad; nothing plays on a hit, a seal or a win.
  const REDUCED = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('tv-reduced');
  const seen = new WeakSet();
  let prevValues = null, prevHand = null, prevEncounter = '';
  // Cinematic reveal, once per Universe, on its first Encounter (Episode 1 · Encounter 1): the painting fills
  // the window's width (letterboxed, so the composition never changes), the opponent appears in its place, the camera pulls back into the scene box (the same element,
  // never rebuilt), then the panels return. ~2.1 s; a click or a key ends it; off under reduced motion. Input
  // stays inert until the panels are back, so the step starts only when the player can act.
  let revealing = false;
  const revealKey = universe => `tv-reveal-v1:${(window.TVLocal && window.TVLocal.runId && window.TVLocal.runId()) || 'local'}:${universe}`;
  const seenReveal = universe => { try { return !!localStorage.getItem(revealKey(universe)); } catch (_) { return false; } };
  const markReveal = universe => { try { localStorage.setItem(revealKey(universe), '1'); } catch (_) {} };
  // Fallback when a Universe is entered without the door (a saved game continued): on its first Encounter.
  function reveal() {
    if (revealing || context.episode !== 1 || context.encounter !== 1 || seenReveal(context.universe)) return;
    const host = document.getElementById('idol');
    if (!host || host.hidden || host.classList.contains('training-post')) return;
    markReveal(context.universe);
    if (!REDUCED()) play({});
  }
  // The continuous shot from the threshold: the scene box, cut to the doorway's shape and laid exactly over the
  // doorway, opens to the full letterboxed width while the stage goes dark; a pause on the world, the camera pulls back
  // into the scene box with the panels, and only then the opponent (if the first screen has one) arrives. `door` = the doorway's screen
  // rectangle; `opened()` is called once the stage is covered (the caller hides it there).
  function play({door = null, opened = () => {}}) {
    const scene = document.getElementById('viewport');
    const r = scene && scene.getBoundingClientRect();
    if (!r || !r.width || !r.height) { opened(); return Promise.resolve(); }
    const W = innerWidth, H = innerHeight, k = Math.min(W / r.width, H / r.height);   // contain: same composition at every size
    const sw = r.width * k, sh = r.height * k, sl = (W - sw) / 2, st = (H - sh) / 2;
    const body = document.body, input = document.getElementById('inputArea');
    // Whatever stands in the scene (the opponent, or the training post in the camp) arrives after the pull-back.
    const opponent = !!document.querySelector('#idol:not([hidden]) > *');
    revealing = true;
    body.style.setProperty('--rv-tx', (W / 2 - (r.left + r.width / 2)) + 'px');
    body.style.setProperty('--rv-ty', (H / 2 - (r.top + r.height / 2)) + 'px');
    body.style.setProperty('--rv-s', String(k));
    if (door) {
      const c = v => Math.max(0, v / k).toFixed(2) + 'px';
      body.style.setProperty('--rv-clip', `inset(${c(door.top - st)} ${c(sl + sw - door.right)} ${c(st + sh - door.bottom)} ${c(door.left - sl)})`);
    }
    body.classList.add('tv-reveal');
    if (door) body.classList.add('tv-rv-door', 'tv-rv-1');
    if (input) input.inert = true;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let done;
    const finished = new Promise(r => { done = r; });
    let wasOpened = false;
    const open = () => { if (!wasOpened) { wasOpened = true; opened(); } };
    const end = () => {
      timers.forEach(clearTimeout); open();
      removeEventListener('pointerdown', end, true); removeEventListener('keydown', end, true);
      body.classList.remove('tv-reveal', 'tv-rv-door', 'tv-rv-open', 'tv-rv-1', 'tv-rv-2', 'tv-rv-3', 'tv-rv-4');
      if (input) input.inert = false;
      revealing = false; done();
    };
    // Enter, see the world, the camera pulls back into the scene box, then the opponent arrives in it.
    const lead = door ? 850 : 450;                                     // the doorway opens to the world (or it fades in)
    const pull = lead + 450;                                           // 450 ms to look at the world, no opponent
    const meet = pull + 700;                                           // 700 ms: the camera pulls back into the scene box
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (door) body.classList.add('tv-rv-open'); else body.classList.add('tv-rv-1');
      at(lead, open);
      at(pull, () => body.classList.add('tv-rv-3'));
      at(pull + 400, () => body.classList.add('tv-rv-4'));           // panels return as the camera settles
      at(meet, () => body.classList.add('tv-rv-2'));                 // the opponent arrives in its place
      at(meet + (opponent ? 550 : 150), end);
    }));
    addEventListener('pointerdown', end, true); addEventListener('keydown', end, true);
    return finished;
  }
  // Called by the threshold when the door has opened and the next Universe is ready on screen.
  function fromDoor(door, universe, opened) {
    markReveal(universe);
    if (REDUCED() || revealing) { opened(); return Promise.resolve(); }
    return play({door, opened});
  }
  function motion() {
    if (REDUCED()) return;
    const hud = document.getElementById('hud');
    if (hud && !hud.hidden) {
      const values = {}, nodes = {};
      for (const node of hud.querySelectorAll('.slot')) {
        const side = node.closest('.hud-you') ? 'you' : node.closest('.hud-them') ? 'them' : 'x';
        const m = /^\s*([^=:\s]+)\s*[=:]\s*(.*)$/.exec(node.textContent || '');
        if (!m) continue;
        values[side + '|' + m[1]] = m[2].trim(); nodes[side + '|' + m[1]] = node;
      }
      const turn = hud.querySelector('.hud-turn-n');
      if (turn) { values['turn'] = turn.textContent.trim(); nodes['turn'] = turn; }
      const key = [context.universe, context.episode, context.encounter].join('|');
      if (prevValues && key === prevEncounter) {
        for (const [k, v] of Object.entries(values)) {
          const node = nodes[k];
          if (k in prevValues && prevValues[k] !== v && !seen.has(node)) { seen.add(node); node.classList.add('tv-changed'); }
          else if (!(k in prevValues) && k !== 'turn' && !seen.has(node)) { seen.add(node); node.classList.add('tv-changed'); }
        }
      }
      const fresh = key !== prevEncounter;
      prevValues = values;
      const idol = document.querySelector('#idol img.tv-monster');
      // Play the arrival once per Encounter. The GUI re-inserts the figure host on every update, and a
      // re-inserted element restarts its animation, so the class is dropped as soon as it has played.
      if (fresh && idol && prevEncounter) {
        idol.classList.remove('tv-enter'); void idol.offsetWidth; idol.classList.add('tv-enter');
        idol.addEventListener('animationend', () => idol.classList.remove('tv-enter'), {once:true});
      }
      if (fresh) prevHand = null;
      if (fresh) reveal();
      prevEncounter = key;
    }
    const cards = [...document.querySelectorAll('#choices .hand-card')];
    if (cards.length && cards.some(c => !seen.has(c))) {
      const names = cards.map(c => (c.querySelector('.card-name') || {}).textContent || '');
      const before = {}; for (const n of prevHand || []) before[n] = (before[n] || 0) + 1;
      let i = 0;
      cards.forEach((card, k) => {
        if (seen.has(card)) return; seen.add(card);
        const n = names[k];
        if (prevHand && before[n] > 0) { before[n]--; return; }
        card.style.setProperty('--tv-delay', (i++ * 45) + 'ms'); card.classList.add('tv-drawn');
      });
      prevHand = names;
    }
    const marks = document.querySelectorAll('.tv-trail img');
    const last = marks[marks.length - 1];
    if (last && !seen.has(last)) { seen.add(last); if (marks.length > 0 && prevEncounter) last.classList.add('tv-drawn'); }
  }
  // Story layer, as in the research interface: trail of Encounters already played in this
  // Episode, the Episode light, and the Episode · Encounter caption. One opponent only.
  let storyKey = '';
  function story(viewport) {
    if (!viewport) return;
    let layer = viewport.querySelector(':scope > .tv-story');
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'tv-story'; layer.setAttribute('aria-hidden', 'true');
      for (const name of ['tv-light', 'tv-sky', 'tv-trail', 'tv-caption']) {
        const part = document.createElement('div'); part.className = name; layer.append(part);
      }
      viewport.prepend(layer);
    }
    const host = document.getElementById('idol');
    const camp = !host || host.hidden || host.classList.contains('training-post');
    const passed = camp ? 0 : Math.max(0, Math.min(7, (context.encounter || 1) - 1));
    const title = document.getElementById('empty');
    const idle = Boolean(title && !title.hidden);
    const key = [context.universe, context.episode, context.encounter, camp, idle].join('|');
    if (key === storyKey) return;
    storyKey = key;
    layer.hidden = idle;
    layer.dataset.episode = String(Math.max(1, Math.min(4, context.episode || 1)));
    layer.dataset.camp = String(camp);
    layer.querySelector('.tv-trail').replaceChildren(...Array.from({length: passed}, () => {
      const mark = document.createElement('img'); mark.src = MARK; mark.alt = ''; return mark;
    }));
    layer.querySelector('.tv-caption').textContent = camp || !context.encounter
      ? `Episode ${context.episode || 1}` : `Episode ${context.episode} · Encounter ${context.encounter}`;
  }
  // The end of an Encounter: the opponent leaves (a copy of it fades and sinks where it stood, since the GUI
  // hides the real one at once), the scene dims a little while notes are written, the text arrives.
  let lastPhase = '', lastFigure = null;
  function endOfEncounter(phase) {
    const host = document.getElementById('idol'), scene = document.getElementById('viewport');
    const img = host && !host.hidden && host.querySelector('img.tv-monster');
    if (img && scene) {
      const a = img.getBoundingClientRect(), b = scene.getBoundingClientRect();
      if (a.width) lastFigure = {src: img.getAttribute('src'), left: a.left - b.left, top: a.top - b.top, width: a.width, height: a.height};
    }
    if (lastPhase === 'act' && (phase === 'note' || phase === 'pick') && lastFigure && scene && !REDUCED()) {
      const ghost = document.createElement('img');
      ghost.src = lastFigure.src; ghost.alt = ''; ghost.className = 'tv-ghost'; ghost.setAttribute('aria-hidden', 'true');
      Object.assign(ghost.style, {left: lastFigure.left + 'px', top: lastFigure.top + 'px', width: lastFigure.width + 'px', height: lastFigure.height + 'px'});
      scene.append(ghost);
      ghost.addEventListener('animationend', () => ghost.remove(), {once: true});
      const text = document.getElementById('context');
      if (text) { text.classList.remove('tv-arrive'); void text.offsetWidth; text.classList.add('tv-arrive'); }
    }
    if (phase !== lastPhase) lastPhase = phase;
  }
  // The record sheet. A note asked for between Encounters is written on its own sheet: it unfolds out of the
  // Record into the middle of the stage, and when it is submitted it folds into a thin card and slides back
  // into the Record. The working note during an Encounter stays the plain field it is. Same words, same
  // field, same submission; only where and how the field is shown changes.
  let sheetFor = null, sheetToken = 0;
  function sheet(phase) {
    const tray = document.getElementById('inputArea'), journal = document.querySelector('.journal');
    const form = document.getElementById('noteForm');
    if (!tray || !form) return;
    // While the engine works out the next step after a submission, leave everything as it is (the sheet is
    // filing itself away); decide only once the next prompt is actually on screen.
    if (form.classList.contains('tv-hold') || !document.getElementById('waiting').hidden) return;
    const visible = phase === 'note' && !form.hidden;
    if (!visible) {
      if (document.body.dataset.sheet) delete document.body.dataset.sheet;
      if (tray.classList.contains('tv-filed') || tray.getAnimations().length) { tray.classList.remove('tv-filed'); tray.getAnimations().forEach(x => x.cancel()); }
      sheetFor = null; sheetToken++; return;
    }
    const prompt = (document.getElementById('context') || {}).textContent || '';
    const caption = (document.querySelector('.tv-caption') || {}).textContent || '';
    if (tray.dataset.sheetTitle !== caption) tray.dataset.sheetTitle = caption;
    document.body.dataset.sheet = '1';
    if (sheetFor === prompt) return;
    sheetFor = prompt;
    const token = ++sheetToken;
    tray.classList.remove('tv-filed');
    tray.getAnimations().forEach(x => x.cancel());
    if (REDUCED() || !journal) return;
    requestAnimationFrame(() => {
      if (token !== sheetToken || !document.body.dataset.sheet || form.hidden || form.classList.contains('tv-hold')) return;
      const J = journal.getBoundingClientRect(), T = tray.getBoundingClientRect();
      if (!T.width || !T.height) return;
      tray.animate([
        {transformOrigin: 'top left', opacity: .2, transform: `translate(${J.left - T.left}px, ${J.top + 60 - T.top}px) scale(${Math.min(1, J.width / T.width)}, ${40 / T.height})`},
        {transformOrigin: 'top left', opacity: 1, transform: 'none'}], {duration: 520, easing: 'cubic-bezier(.45,0,.25,1)'});
    });
  }
  document.addEventListener('submit', event => {
    const tray = document.getElementById('inputArea'), journal = document.querySelector('.journal');
    if (event.target.id !== 'noteForm' || !document.body.dataset.sheet || !tray || !journal || REDUCED()) return;
    sheetToken++;                                   // a pending unfold must not play over the filing
    tray.getAnimations().forEach(x => x.cancel());
    const J = journal.getBoundingClientRect(), T = tray.getBoundingClientRect();
    const filing = tray.animate([
      {transformOrigin: 'top left', opacity: 1, transform: 'none'},
      {transformOrigin: 'top left', opacity: .9, offset: .45, transform: `translate(0px, ${T.height * .45}px) scale(1, .08)`},
      {transformOrigin: 'top left', opacity: 0, transform: `translate(${J.left + 16 - T.left}px, ${J.top + 64 - T.top}px) scale(${(J.width - 32) / T.width}, ${30 / T.height})`}],
      {duration: 480, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards'});
    filing.finished.then(() => tray.classList.add('tv-filed')).catch(() => {});
  }, true);
  // The note field takes the focus when a note is asked for; Cmd/Ctrl + Enter submits it.
  let focusedFor = null;
  function focusNote(phase) {
    const form = document.getElementById('noteForm'), input = document.getElementById('noteInput');
    if (phase !== 'note' || !form || form.hidden || !input || revealing) { if (phase !== 'note') focusedFor = null; return; }
    const prompt = (document.getElementById('context') || {}).textContent || '';
    if (focusedFor === prompt) return;
    focusedFor = prompt;
    setTimeout(() => { if (!form.hidden && document.activeElement !== input) input.focus({preventScroll: true}); }, 60);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && event.target && event.target.id === 'noteInput') {
      const form = document.getElementById('noteForm');
      if (form && !form.hidden) { event.preventDefault(); form.requestSubmit(); }
    }
  });
  function setContext(value) {
    if (!value || !Number.isInteger(value.universe) || value.universe < 1 || value.universe > 5) return;
    const {universe, episode, encounter} = value;
    context = {...context, universe, ...(episode ? {episode} : {}), ...(encounter != null ? {encounter} : {})};
    decorate();
  }
  function observeHeader(text) {
    const match = /^World (\d+), (?:Life (\d+)|Camp|Letter)\s*$/m.exec(text || '');
    if (match) {
      const universe = Number(match[1]);
      if (universe >= 1 && universe <= 5) setContext({universe, episode:Number(match[2] || 1)});
    }
  }
  let queued = false;
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') renameNode(record.target);
      else record.addedNodes.forEach(renameNode);
    }
    if (!queued) { queued = true; queueMicrotask(() => { queued = false; decorate(); }); }
  }).observe(document.body, {childList:true, subtree:true, characterData:true});
  renameNode(document.body);
  window.TVSkins = Object.freeze({setContext, observeHeader, decorate, interface:INTERFACE, fromDoor,
    applyCurrent:decorate, metadata:() => ({...context, interface:INTERFACE})});
  decorate();
})();
