/* Encounter-transition acceptance check (2026-11-24). Paste into the console of /play/?dev=1 while a game is in
 * an Encounter (phase "act"), then:   await TVCheck.run({quick: false, long: false})
 * It plays until the Encounter ends, writes the note, and returns a timeline in ms from the opponent's exit:
 *   ghost  — the leaving opponent;  unfold — the sheet's unfold;  focus — note field focused;
 *   submit — note submitted (quick: 120 ms after the sheet appears, i.e. during the unfold);
 *   legs   — the filing animations;  landed — the note's lines tinted in the Record;  next — next opponent shown;
 * plus layout checks: nested scrolling in the sheet, sheet inside the stage, Record entry visible on landing.
 * Moves are random-ish (first card, END every third step); the engine is the real one. */
window.TVCheck = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = id => document.getElementById(id);
  const idle = async () => { for (let k = 0; k < 150; k++) { await sleep(40); if ($('waiting').hidden) break; } await sleep(120); };
  async function send(cmd) { const i = $('rawInput'); i.value = cmd; i.dispatchEvent(new Event('input', {bubbles: true})); $('rawSubmit').click(); await idle(); }
  const scrolls = el => el && el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY);
  async function run({quick = false, long = false} = {}) {
    const t = {}; let t0 = 0; const now = () => Math.round(performance.now() - t0);
    const tray = $('inputArea'), record = $('transcript');
    // Watch the page.
    const orig = Element.prototype.animate; const legs = [];
    Element.prototype.animate = function (kf, opt) {
      const a = orig.call(this, kf, opt);
      if (t0 && this === tray && !(opt && opt.pseudoElement)) {
        const rec = {start: now(), dur: opt.duration, delay: opt.delay || 0}; legs.push(rec);
        a.finished.then(() => { rec.end = now(); }, () => { rec.cancelled = now(); });
      }
      return a;
    };
    const mo = new MutationObserver(list => {
      for (const m of list) for (const n of m.addedNodes || []) {
        if (n.classList && n.classList.contains('tv-ghost') && !t0) { t0 = performance.now(); t.ghost = 0; n.addEventListener('animationend', () => { t.ghostEnd = now(); }, {once: true}); }
        if (n.classList && n.classList.contains('tv-note-mark') && t.submit != null) t.markAt = now();
      }
      if (!t0) return;
      if (document.body.dataset.sheet && t.sheet == null) t.sheet = now();
      if (t.submit != null && t.next == null && document.body.dataset.phase === 'act') {
        const img = document.querySelector('#idol img.tv-monster'), host = $('idol');
        if (img && host && !host.hidden && !document.body.classList.contains('tv-filing-now') && getComputedStyle(img).opacity !== '0') t.next = now();
      }
    });
    mo.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-sheet', 'data-phase', 'hidden', 'class']});
    $('noteInput').addEventListener('focus', () => { if (t0 && t.focus == null) t.focus = now(); }, {once: false});
    // Play to the end of the Encounter.
    let n = 0;
    while (document.body.dataset.phase === 'act' && n < 300) {
      const cards = [...document.querySelectorAll('.card')].filter(c => !c.disabled).map(c => c.textContent.trim().replace(/\(.*$/, ''));
      await send((n % 3 === 2 || !cards.length) ? 'END' : cards[0]); n++;
    }
    if (document.body.dataset.phase !== 'note') { Element.prototype.animate = orig; mo.disconnect(); return {error: 'no note after the Encounter', phase: document.body.dataset.phase}; }
    if (long) {   // a long prompt is the engine's; a long note is ours
      $('noteInput').value = Array.from({length: 40}, (_, i) => `Line ${i + 1}: the opponent answered strike with block, block with strike.`).join('\n');
      $('noteInput').dispatchEvent(new Event('input', {bubbles: true}));
    }
    await sleep(quick ? 120 : 900);
    // Layout checks while the sheet is open.
    const S = tray.getBoundingClientRect(), stage = tray.parentElement.getBoundingClientRect();
    const layout = {
      sheetScrolls: scrolls(tray), promptScrolls: scrolls(document.querySelector('.dialogue.tv-between')), fieldScrolls: scrolls($('noteInput')),
      sheetInsideStage: S.top >= stage.top - 1 && S.bottom <= stage.bottom + 1, sheetH: Math.round(S.height), stageH: Math.round(stage.height),
      buttonVisible: (() => { const b = $('noteSubmit').getBoundingClientRect(); return b.bottom <= Math.min(innerHeight, S.bottom) + 1 && b.top >= S.top - 1; })(),
    };
    if (!long) { $('noteInput').value = 'Check note: blocks answered strikes.'; $('noteInput').dispatchEvent(new Event('input', {bubbles: true})); }
    t.submit = now(); $('noteSubmit').click();
    for (let k = 0; k < 120 && (t.next == null || document.body.dataset.sheet); k++) await sleep(50);
    await sleep(400);
    const mark = document.querySelector('.tv-note-mark');
    t.landedVisible = !mark ? 'mark gone' : (() => { const m = mark.getBoundingClientRect(), r = record.getBoundingClientRect(); return m.bottom > r.top && m.top < r.bottom; })();
    Element.prototype.animate = orig; mo.disconnect();
    return {quick, long, n, t, legs, layout, after: {phase: document.body.dataset.phase, sheet: document.body.dataset.sheet || null, trayStyle: tray.getAttribute('style') || ''}};
  }
  return {run};
})();
