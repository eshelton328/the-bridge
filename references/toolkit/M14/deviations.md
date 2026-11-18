# M14 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit M14, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityHeadlessPhone.ts: M10's
view with Headless picked. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame has no exceptions.json.

## Checks

- Text: fail. 3 not visible: `ambitious` (477:2593), `evals` (477:2594),
  `176 calls` (477:2596).
- Position: 15 of 37 layers pass. The 22 that fail: `toolkit` h +441;
  `source · segmented` w -15.7; `kpis` h +8; `panel · calls per day` h
  +31; `panel · BY SKILL EVAL` y +33; `eval · writer` y +28;
  `link · writer` y +28 w +6.2; `eval · pr-description` y +30;
  `link · pr-description` y +30 w +6.8; `eval · agents-md` y +32;
  `link · agents-md` y +32 w +6.8; `eval · ambitious` y +34;
  `link · ambitious` y +34 w +6.8; `panel · most called` y +36;
  `bar · pr-description-checker` y +36; `bar · pr-description` y +36;
  `bar · writer` y +36; `bar · agents-md` y +36;
  `bar · writing-reviewer` y +36; `bar · ambitious` y +36;
  `bar · readme` y +36; `bar · audit-slop` y +36. Each is explained
  below.
- Rules: fail. 1 findings: `hiddenOverflow` at
  `div > div.backdrop > div.backdrop > div.app-shell__root > main.app-shell__detail`.
  Each is explained below; this frame takes no exceptions.

## Differences

- **Key figures** (`kpis` and each `kpi · …`: y -6 h +6 on the desktop,
  y -7 on a tablet, h +8 two by two on the phone). `KpiTile` stacks the
  label under the value in one colour, where Figma puts the label on the
  value's line and draws the 8 hook blocks red (Activity KPI tile). The
  tiles start higher because the rows over them are shorter.
- **Runs** (each `run · …` h +8 and the second y +7 on the desktop; y -5
  on a tablet). Each run is a `ListRow` card 86 high on the desktop,
  where Figma's is 78; the live dot comes after the name and the kind
  icon sits at the row's top (Activity run row). The runs' panel and the
  calls per day beside it are as tall as the taller, 16 px taller than
  Figma's (`row · now and per day`, `panel · RUNNING NOW`,
  `panel · CALLS PER DAY` h +16).
- **Calls per day** (`chart · …` h +21 on the desktop;
  `panel · calls per day` h +19 on a tablet, h +31 on the phone).
  `DailyBarChart` draws its own axis and is 78 high on every layout,
  where Figma's bars are 56 on a tablet and 44 on the phone (Activity
  daily chart). Every part under it starts that much lower.
- **Evals** (each `eval · …` and `link · …` w +6.2 or +6.8;
  `panel · BY SKILL EVAL`). The skill's chip is a `MapNode` 28 high and
  about 6 px wider (Activity item chip). The share bar is
  `HorizontalBarChart` with one row: 10 high with no track, where
  Figma's is 6 high on a dark track as wide as the row (Eval share bar).
  A tap on the row opens the skill's Evals tab and a tap on the chip its
  page; the fill of a hovered row lies behind its text.
- **Most called** (`panel · MOST CALLED` or `panel · most called` and
  each `bar · …`). `HorizontalBarChart` puts its rows 24 apart where
  Figma's desktop rows are 26, so each row is 2 px closer to the one
  over it; its labels are in the small style in a column as wide as the
  longest, and every bar is cyan where Figma draws the agents violet
  (Most called bars). On a tablet the rows are 8 px narrower: the panel
  pads 16 at the sides where Figma pads 15 and 16.
- **Page** (`toolkit` h +441). Figma's `toolkit` ends at the tab bar;
  the render's section holds the evals and Most called, which run under
  the bar, as in Figma.
- **Under the tab bar** (`ambitious`, `evals`, `176 calls` not visible).
  Under the taller chart the fourth eval lies under the bar.
- **Show all 7 evals** is `Button variant="text" size="xs"`, 8 in from
  Figma's place (Show all link); it shows all seven evals.
- **Rules and text under the tab bar** (`hiddenOverflow` at
  `main.app-shell__detail` or its `scroll-frame__body`). The page runs
  under the tab bar, as in Figma (AppShell `tabBarOverlay`), and
  scrolls; under the taller chart the last rows Figma shows over the bar
  lie under it, so their text is not visible.
