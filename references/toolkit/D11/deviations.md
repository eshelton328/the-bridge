# D11 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D11, 2026-11-18, against library 1.0.0-beta.42: a first run and
three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivity.ts: D1's list with the
Activity view and All sessions. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before the Activity view.
The frame's `exceptions.json` holds only icon sizes (Differences).

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 12 of 49 layers pass. The 37 that fail: `toolkit` h -54;
  `filter · chips` y -2 w -14.2 h -2; `source · segmented` y -4 w -15.6
  h -2; `counts legend` x +0.6 y -4.5 w -0.6 h -1; `activity` y -6 h
  -10; `kpis` y -6 h +6; `kpi · toolkit calls` y -6 h +6; `kpi · from
  headless runs` y -6 h +6; `kpi · from chats` y -6 h +6; `kpi · hook
  blocks` y -6 h +6; `row · now and per day` h +22; `panel · RUNNING
  NOW` h +22; `run · writing-reviewer` y -1 h +8; `run ·
  skill-eval-round` y +7 h +8; `run · pr-description-checker` y +15 h
  +8; `panel · CALLS PER DAY` h +22; `chart · Chats` y -4 h +21; `row ·
  most called and log` y +22 h -37; `panel · MOST CALLED` y +22 h -37;
  `bar · pr-description-checker` y +20 h -1; `bar · pr-description` y
  +18 h -1; `bar · writer` y +16 h -1; `bar · agents-md` y +14 h -1;
  `bar · writing-reviewer` y +12 h -1; `bar · ambitious` y +10 h -1;
  `bar · readme` y +8 h -1; `bar · audit-slop` y +6 h -1; `panel · LOG`
  y +22 h -37; `log · 01:16:40` y +20 h -1; `log · 01:16:02` y +20 h -1;
  `log · 01:14:55` y +20 h -1; `log · 01:12:20` y +20 h -1; `log ·
  01:10:03` y +20 h -1; `log · 01:08:47` y +20 h -1; `log · 01:05:12` y
  +20 h -1; `log · 01:02:30` y +20 h -1; `source note` y -15 h -1. Each
  is explained below.
- Rules: pass.

## Differences

- **Page** (`toolkit` h -54). Figma's `toolkit` runs to the window's
  foot; the section in the render ends with the source line.
- **Key figures** (`kpis`, `kpi · toolkit calls`, `kpi · from headless
  runs`, `kpi · from chats`, `kpi · hook blocks`: y -6 h +6). Figma puts
  each label on its value's line, in a larger value style, and colours
  the chats' 25 cyan and the hook blocks' 25 red. `KpiTile` stacks the
  label under the value in one colour, so each tile is 86 high where
  Figma's is 80 (LIBRARY_GAPS.md, Activity KPI tile). The tiles start 6
  higher because the rows over them are shorter (next item).
- **Kind chips, source switch and since** (`filter · chips` y -2 w -14.2
  h -2; `source · segmented` y -4 w -15.6 h -2; `counts legend` y -4.5;
  `activity` y -6). The header and the chips are D1's, 2 px shorter in
  the library (Kind chip row, View switch 38 px); the source switch is
  the library's `ViewSwitch` with no icons, 36 high and 16 px narrower
  than Figma's 38 (View switch 38 px). Chats and Headless runs are
  enabled, as Erik approved on 2026-11-18: their labels are drawn in the
  switch's full colour, no longer dimmed as disabled, and a tap opens
  D15's or D16's view.
- **Runs** (`run · writing-reviewer` h +8, `run · skill-eval-round` y +7
  h +8, `run · pr-description-checker` y +15 h +8; `panel · RUNNING NOW`,
  `row · now and per day` and `panel · CALLS PER DAY` h +22). Each run
  is a `ListRow` card 86 high, where Figma's is 78: the row's lines are 4
  apart, and its chips (`MetaChip size="sm"`) are on the 4 px grid. The
  live dot comes after the name, where Figma has it at the row's start,
  and the kind icon sits at the row's top (Activity run row). The runs'
  panel and the calls per day beside it are as tall as the taller,
  22 px taller than Figma's. Open session is `Button size="sm"
  textSize="xs"`, about 114 wide against Figma's 113, with a 12 px
  label where Figma's is Medium 11 (444:543): `labelXs` is the
  library's smallest button label. The agent icons are `kind.agent`
  violet, as Figma's; the workflow icon is `kind.workflow` green where
  Figma draws it a dim #3b7468, about 40 % of that green (500:12061),
  and no icon token has that tone (Activity run row).
- **Calls per day** (`chart · Chats` y -4 h +21). `DailyBarChart` draws
  the axis under the last chart inside it, where Figma's `axis` is its
  own layer (Activity daily chart).
- **Most called and the log** (`row · most called and log`, `panel ·
  MOST CALLED` and `panel · LOG` y +22 h -37; each `bar · …` y from +20
  down to +4, h -1; each `log · …` y +20 h -1; `source note` y -15).
  The row starts 22 lower, under the taller runs. `HorizontalBarChart`
  puts its rows 24 apart, where Figma's are 26, so each row is 2 px
  closer to the one over it; its labels are in the small style in a
  column as wide as the longest, and every bar is cyan where Figma draws
  the agents violet (Most called bars). The log's lines are 16 high on
  the 4 px grid (d-072), 1 less than Figma's 17. Both panels end 37 px
  higher, and the source line follows them.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (444:137)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 444:137 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (444:142)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 444:142, as for `icon/artifacts`.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
