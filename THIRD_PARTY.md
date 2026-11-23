# Third-party runtime notices

The original TransVerse game code, supplied skins and original AGIIPixel glyph
art are kept separate from third-party runtime components. No general license
for the TransVerse research code or art is granted by this notice.

The browser runtime is pinned to Pyodide 0.29.0, served from this repository.
Its runtime files and dependency hashes are listed in `docs/runtime-manifest.json`.

- Pyodide: Mozilla Public License 2.0; see `licenses/Pyodide-LICENSE`.
- CPython: Python Software Foundation license; see `licenses/Python-LICENSE`.
- tiktoken 0.9.0 and its o200k_base vocabulary: MIT; see `licenses/tiktoken-LICENSE`.
- Additional pinned runtime dependencies (regex, requests, charset-normalizer,
  idna, urllib3, certifi, OpenSSL) retain their upstream notices in the vendored
  wheel archives. These archives are not modified.

Original runtime source: https://github.com/pyodide/pyodide/tree/0.29.0

To retrieve the same pinned dependencies, run `python3 tools/fetch_runtime.py`.
Package files are checked against the upstream lockfile; all files also have
recorded SHA-256 hashes in the runtime manifest.

## Fonts on the outer pages, consent page and threshold

- Anton, Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont). SIL Open Font License 1.1, `site/assets/fonts/Anton-OFL.txt`.
- Space Grotesk, Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk). SIL Open Font License 1.1, `site/assets/fonts/SpaceGrotesk-OFL.txt`.
Both files are unmodified copies from https://github.com/google/fonts (ofl/anton, ofl/spacegrotesk), downloaded 2026-11-24.

## Traveller illustration

- `ui/art/traveller.webp`: the threshold traveller, drawn by the project team and polished with AI assistance (2026-11-24); second version 2026-11-24, cropped to the figure and resized to 394 × 580 from the 1226 × 1283 original, otherwise unchanged.
