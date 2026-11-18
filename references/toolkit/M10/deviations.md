# M10 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit M10, 2026-11-18, against library 1.0.0-beta.42: a first run and
three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityPhone.ts: T9's counts with
two runs under the phone's header. A tap on a run opens it on a page of
its own, as the note says; no frame draws that page. The library gaps
are in web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame
gives the same text, position and rule results as before the Activity
view. The frame has no exceptions.json.

## Checks

- Text: fail. 6 strings are not visible: `MOST CALLED` (449:626), `442`
  (449:634), `writer` (449:646), `330` (449:648), `agents-md` (449:653),
  `261` (449:655).
- Position: 16 of 26 layers pass. The 10 that fail: `toolkit` h +161;
  `source · segmented` y -1 w -15.7 h -2; `kpis` y -3 h +8; `panel ·
  calls per day` y +1 h +64; `panel · most called` y +65 h -1; `bar ·
  pr-description-checker` x +2 y +65 w -4 h -1; `bar · pr-description` x
  +2 y +65 w -4 h -1; `bar · writer` x +2 y +65 w -4 h -1; `bar ·
  agents-md` x +2 y +65 w -4 h -1; `bar · writing-reviewer` x +2 y +65 w
  -4 h -1. Each is explained below.
- Rules: fail. 1 findings: `hiddenOverflow` at `div > div.backdrop >
  div.backdrop > div.app-shell__root > main.app-shell__detail`. Each is
  explained below; this frame takes no exceptions.

## Differences

- **Page** (`toolkit` h +161). Figma's `toolkit` ends at the tab bar;
  the render's section holds all of Most called, which runs under the
  bar, as in Figma.
- **Source switch and key figures** (`source · segmented` y -1 w -15.7
  h -2; `kpis` y -3 h +8). The switch is `ViewSwitch` 36 high and 16 px
  narrower (View switch 38 px); each tile is 68 high where Figma's is 64
  (Activity KPI tile), and the values are in one colour.
- **Calls per day** (`panel · calls per day` h +64). The library's chart
  is 78 high where the phone's bars are 44 (Activity daily chart).
- **Most called under the tab bar** (`panel · most called` y +65; each
  `bar · …` x +2 y +65 w -4; not visible: `MOST CALLED`, `442`,
  `writer`, `330`, `agents-md`, `261`; rules: `hiddenOverflow` at
  `main.app-shell__detail`). Under the taller chart Most called starts
  65 lower, so its header and first rows lie under the tab bar, where
  Figma shows them over it; the page scrolls them into view (Activity
  daily chart). Every bar is cyan (Most called bars).
- **Runs** are two `ListRow` cards 58 high, the dot after the name
  (Activity run row); they pass the position check.
