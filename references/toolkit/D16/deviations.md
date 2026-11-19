# D16 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D16, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityHeadless.ts: D11's view
with Headless runs picked. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame's `exceptions.json` holds only icon sizes (Differences).

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 13 of 46 layers pass. The 33 that fail: `toolkit` h -64;
  `filter · chips` w -14.2; `source · segmented` w -15.6;
  `counts legend` y -4.5; `activity` y -6 h -20; `kpis` y -6 h +6;
  `kpi · sessions` y -6 h +6; `kpi · loaded an item` y -6 h +6;
  `kpi · toolkit calls` y -6 h +6; `kpi · median` y -6 h +6;
  `row · now and per day` h +16; `panel · RUNNING NOW` h +16;
  `run · skill-eval-round` h +8; `run · readme-cold-reader` y +7 h +8;
  `panel · CALLS PER DAY` h +16; `chart · Headless runs` h +21;
  `row · most called and log` y +16 h -41; `panel · BY SKILL EVAL` y +16
  h -41; `eval · writer` y +11; `link · writer` y +11 w +6.2;
  `eval · pr-description` y +13; `link · pr-description` y +13 w +6.8;
  `eval · agents-md` y +15; `link · agents-md` y +15 w +6.8;
  `eval · ambitious` y +17; `link · ambitious` y +17 w +6.8;
  `panel · MOST CALLED` y +16 h -41; `bar · pr-description-checker` y
  +14; `bar · pr-description` y +12; `bar · writer` y +10;
  `bar · agents-md` y +8; `bar · writing-reviewer` y +6; `source note` y
  -25. Each is explained below.
- Rules: pass.

## Differences

- **Header, chips and source switch** (`filter · chips` w -14.2;
  `source · segmented` w -15.6, y -4 or -5 on a tablet; `counts legend`
  y -4.5). The chips are D1's, 2 px shorter in the library (Kind chip
  row); the switch is `ViewSwitch` 36 high and 16 px narrower than
  Figma's 38 (View switch 38 px).
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
- **Show all 7 evals** shows all seven evals, as T12 lists them.
- **Page and source line** (`toolkit` h -64; `activity` y -6 h -20;
  `row · most called and log`, `panel · BY SKILL EVAL` and
  `panel · MOST CALLED` y +16 h -41; `source note` y -25). The two
  panels are as tall as their content, where Figma's run to 879; the
  source line follows them.
- **readme-cold-reader's icon** is the agent icon in `kind.agent`, as
  Figma's.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (477:731)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 477:731 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (477:736)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 477:736, as for `icon/artifacts`.
