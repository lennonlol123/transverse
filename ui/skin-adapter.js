/* Only opaque cosmetic coordinates and already-public labels enter this module.
 * Interface version: transverse-white-v1.
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
  const INTERFACE = 'transverse-white-v1';
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
    const inEncounter = document.body.dataset.phase === 'act';
    if (dialogue && journal && transcript) {
      dialogue.classList.toggle('tv-feedback', inEncounter);
      if (inEncounter && dialogue.parentElement !== journal) journal.insertBefore(dialogue, transcript);
      if (!inEncounter && dialogue.parentElement !== document.getElementById('viewport')) document.getElementById('viewport').append(dialogue);
      dialogue.setAttribute('aria-label', inEncounter ? 'Latest feedback' : 'Context');
    }
    const viewport = document.getElementById('viewport');
    if (viewport) {
      const value = 'url("' + world().scene + '")';
      if (viewport.style.backgroundImage !== value) viewport.style.backgroundImage = value;
    }
    story(viewport);
    const host = document.getElementById('idol');
    if (host && !host.hidden && !host.classList.contains('training-post')) {
      let image = host.querySelector('img.tv-monster');
      if (!image || image.dataset.universe !== String(context.universe)) {
        image = document.createElement('img'); image.className = 'tv-monster';
        image.src = world().opponent; image.alt = ''; image.setAttribute('aria-hidden', 'true');
        image.dataset.universe = String(context.universe); host.replaceChildren(image);
      }
    }
    paintCards();
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
  window.TVSkins = Object.freeze({setContext, observeHeader, decorate, interface:INTERFACE,
    applyCurrent:decorate, metadata:() => ({...context, interface:INTERFACE})});
  decorate();
})();
