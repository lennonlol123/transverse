# TransVerse

A Benchmark for Continual Learning and Intelligence Transfer Across the Multiverse.
A research benchmark from Encode Lab, Westlake University.

**Site:** https://lennonlol123.github.io/transverse/ (trial; later westlake-encode-lab)

The game runs the study's own map pack `engine/data/pack_v3c1_v7hard4.json` and rest table
`engine/data/restamt/r1v2x130c.json`, unchanged (user decision, 2026-11-24).

## Layout

- `site/`: outer pages (portal, welcome, how it works, enter). No gameplay information
  outside `how-it-works.html`.
- `ui/`: the research GUI (`base.html`, synced from the research interface on 2026-11-24),
  the white skin (`skins.css`, `skin-adapter.css`, `skin-adapter.js`), the consent and run
  bar (`demo.html`, `demo.css`), one painting and one opponent per Universe (`art/`), and the
  research display-term table (`display-terms.json`).
- `engine/`, `src/`, `vendor/`: the original Python engine running in the browser (Pyodide).
- Interface version marker: `transverse-white-v11` (shown under SHOW, written into exports).

## Local preview

```sh
python3 tools/build_site.py
python3 tools/check_release.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8000/. The game is at `/play/`.

## Developer mode and languages

- `play/?dev=1` shows a Developer box on the start page: start any Universe directly (from its Episode 1),
  with or without the door. During a run, SHOW → `DEV U1–U5 Go` jumps to another Universe. Developer runs get
  a `DEV-` run ID, `dev: true`, no consent record and `firstPlaythrough: false` in saves and exports. For a
  Universe after the first, `src/browser_runtime.py` writes a clearly marked empty letter for the Universe
  before (only when `dev` is set); players always play in order with the real letter. Starting at a later
  Episode is not offered: the engine carries health from the earlier lives' records.
- Chinese: the outer pages are generated as `dist/zh/` (`tools/zh_pages.py`); the play page takes
  `?lang=zh|en` (remembered in the browser; switch on the start page or under SHOW). Chinese covers the frame
  around the game; prompts, the Record, card names and commands stay English as in the research version.
  Each save records `lang`.
