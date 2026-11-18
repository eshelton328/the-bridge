# T12 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit T12, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityHeadlessTablet.ts: T9's
page with Headless picked. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame has no exceptions.json.

## Checks

- Text: fail. 2 not visible:
  `515 sessions · none loaded an item · Nov 9` (477:1945),
  `404 sessions · 55 loaded an item · Oct 31 to Nov 9` (477:1955).
- Position: 8 of 39 layers pass. The 31 that fail: `back row` h +8;
  `source · segmented` y -5 w -15.7; `kpis` y -7; `kpi · sessions` y -7;
  `kpi · loaded an item` y -7; `kpi · toolkit calls` y -7;
  `kpi · median` y -7; `run · readme-cold-reader` y -5;
  `panel · calls per day` y -7 h +19; `panel · BY SKILL EVAL` y +12 h
  +27; `eval · writer` y +7 w -8; `link · writer` y +7 w +6.2;
  `eval · pr-description` y +9 w -8; `link · pr-description` y +9 w
  +6.8; `eval · agents-md` y +11 w -8; `link · agents-md` y +11 w +6.8;
  `eval · ambitious` y +13 w -8; `link · ambitious` y +13 w +6.8;
  `eval · readme` y +15 w -8; `link · readme` y +15 w +6.2;
  `eval · readme-reads folder` y +17 w -8 h +11; `eval · other folders`
  y +28 w -8 h +11; `panel · most called` y +39;
  `bar · pr-description-checker` y +39 w -8; `bar · pr-description` y
  +39 w -8; `bar · writer` y +39 w -8; `bar · agents-md` y +39 w -8;
  `bar · writing-reviewer` y +39 w -8; `bar · ambitious` y +39 w -8;
  `bar · readme` y +39 w -8; `bar · audit-slop` y +39 w -8. Each is
  explained below.
- Rules: fail. 1 findings: `hiddenOverflow` at
  `div.backdrop > div.app-shell__root > main.app-shell__detail > div.scroll-frame__root > div.scroll-frame__body:nth-of-type(2)`.
  Each is explained below; this frame takes no exceptions.

## Differences

- **Back row** (`back row` h +8). `BackRow`'s label is `labelLg` with an
  18 px chevron, 28 high, where Figma's row is 20 (Item breadcrumb).
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
- **Folders with no skill** (`eval · readme-reads folder`,
  `eval · other folders` h +11). Their name is in the label style on a
  top row as high as a chip's (28), where Figma's is 20. They take no
  tap and have no chevron, where Figma draws one: no frame says what a
  folder opens.
- **Under the tab bar** (`515 sessions · none loaded an item · Nov 9`,
  `404 sessions · 55 loaded an item · Oct 31 to Nov 9` not visible).
- **Rules and text under the tab bar** (`hiddenOverflow` at
  `main.app-shell__detail` or its `scroll-frame__body`). The page runs
  under the tab bar, as in Figma (AppShell `tabBarOverlay`), and
  scrolls; under the taller chart the last rows Figma shows over the bar
  lie under it, so their text is not visible.
