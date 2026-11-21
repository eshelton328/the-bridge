# D12 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D12, 2026-11-18, against library 1.0.0-beta.42: a first run and
three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityRun.ts: D11's view with the
writing-reviewer run open beside it. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before the Activity view.
The frame's exceptions.json excepts the `hiddenOverflow` finding below,
with the entry that records it; with it the rules check now passes.
Since library 1.0.0-beta.67 (2026-11-19) the key figures' captions wrap
onto a second line (`KpiTile captionLines`), so the headless runs'
caption shows whole and its two exceptions are gone.

## Checks

From `pnpm fidelity toolkit` on 2026-11-19, against library
1.0.0-beta.67, after the key figures' captions wrap (see Key figures).

- Text: pass. Every Figma string is in the render and seen.
- Position: 6 of 68 layers pass. The 62 that fail: `toolkit` w -420 h
  +26; `445:154` w -420 h -2; `read-only` x -417.8 y -1.5 w -1.7 h +1;
  `view · List, Map or Activity` x -419.5 w -0.5 h -2; `filter · chips`
  y -2 w -14.2 h -2; `list tools` y -4 w -420 h -2; `source · segmented`
  y -4 w -15.6 h -2; `counts legend` x -419.4 y -4.5 w -0.6 h -1;
  `activity` y -6 w -420 h +70; `kpis` y -6 w -420 h +22; `kpi · toolkit
  calls` y -6 w -105 h +22; `kpi · from headless runs` x -105 y -6 w
  -105 h +22; `kpi · from chats` x -210 y -6 w -105 h +22; `kpi · hook
  blocks` x -315 y -6 w -105 h +22; `row · now and per day` y +16 w -420
  h +70; `panel · RUNNING NOW` y +16 w -210 h +70; `run ·
  writing-reviewer` y +15 w -210 h +24; `run · skill-eval-round` y +39 w
  -210 h +24; `run · pr-description-checker` y +63 w -210 h +24; `panel
  · CALLS PER DAY` x -210 y +16 w -210 h +70; `chart · Headless runs` x
  -210 y +13 w -210 h -1; `chart · Chats` x -210 y +12 w -210 h +21;
  `row · most called and log` y +86 w -420 h -37; `panel · MOST CALLED`
  y +86 w -210 h -37; `bar · pr-description-checker` y +84 w -210 h -1;
  `bar · pr-description` y +82 w -210 h -1; `bar · writer` y +80 w -210
  h -1; `bar · agents-md` y +78 w -210 h -1; `bar · writing-reviewer` y
  +76 w -210 h -1; `bar · ambitious` y +74 w -210 h -1; `bar · readme` y
  +72 w -210 h -1; `bar · audit-slop` y +70 w -210 h -1; `bar ·
  readme-cold-reader` y +68 w -210 h -1; `panel · LOG` x -210 y +86 w
  -210 h -37; `log · 01:16:40` x -210 y +84 w -210 h -1; `log ·
  01:16:02` x -210 y +84 w -210 h -1; `log · 01:14:55` x -210 y +84 w
  -210 h -1; `log · 01:12:20` x -210 y +84 w -210 h -1; `log · 01:10:03`
  x -210 y +84 w -210 h -1; `log · 01:08:47` x -210 y +84 w -210 h -1;
  `log · 01:05:12` x -210 y +84 w -210 h -1; `log · 01:02:30` x -210 y
  +84 w -210 h -1; `source note` y +49 w -420 h +15; `side panel · run`
  x +20 w -20; `445:466` x +20 y +1 w -19 h -1; `445:478` x +20 y -6 w
  -19; `fields` x +20 y -8 w -19 h +8; `field · Session` x +20 y -8 w
  -19 h -1; `field · Project` x +20 y -9 w -19 h -1; `field · Feature` x
  +20 y -10 w -19 h -2; `field · Started by` x +20 y -12 w -19 h -1;
  `field · Workflow` x +20 y -13 w -19 h +15; `field · Model` x +20 y +2
  w -19; `field · Tokens` x +20 y +2 w -19; `field · Cost` x +20 y +2 w
  -19 h -1; `field · Toolkit version` x +20 y +1 w -19 h -1; `steps` x
  +20 y -5 w -19 h -22; `step · 0:00` x +20 y -5 w -19 h -14; `step ·
  0:21` x +20 y -7 w -19 h -14; `step · 0:24` x +20 y -9 w -19 h -14;
  `step · 0:58` x +20 y -11 w -19 h -14; `step · 1:42` x +20 y -13 w -19
  h -14. Each is explained below.
- Rules: fail. 1 finding: `hiddenOverflow` at `div > div.backdrop >
  div.backdrop > div.app-shell__root > main.app-shell__detail` (the
  view is taller than the window). It is explained below; the frame's
  exceptions.json excepts it.

## Differences

- **The view under the panel** (`toolkit` w -420 h +26; `445:154` w
  -420; `read-only` x -417.8; `view · List, Map or Activity` x -419.5;
  `list tools` w -420; `counts legend` x -419.4; `activity`, `kpis` and
  the two rows w -420; each `kpi · …` x and w by 105; each panel, chart,
  `bar · …` and `log · …` w -210, the right column's x -210; `source
  note` w -420 h +15). Figma lays its 440 px panel over the view, which
  keeps its width under it. The library's `AppShell` has a side slot of
  420 and narrows the detail beside it, so the view is 420 px narrower
  and the source line wraps to two lines (Run side panel).
- **Two-line caption** (`kpis` and each `kpi · …` h +22; every row
  under them 16 lower). In the narrower view the caption `claude -p and
  the SDK, mostly skill evals` (445:227) is wider than its tile, where
  Figma's wider view keeps it on one line. The tiles take
  `captionLines={2}`, so it wraps and shows whole (until library
  1.0.0-beta.67 `KpiTile` cut it with an ellipsis); the tile grows by one
  16 px line, the row's tiles stretch to it, and everything under the
  key figures starts 16 px lower (KPI tile, Run side panel).
- **Runs' lines** (`run · writing-reviewer` y +15 h +24, `run ·
  skill-eval-round` y +39 h +24, `run · pr-description-checker` y +63 h
  +24; rules: `hiddenOverflow` at `main.app-shell__detail`). The line
  under each run's name wraps to two lines in the narrower view, so
  every word shows, where Figma's wider view has one line. Each run is
  16 px taller than on D11, the rows under the runs start 48 lower, and
  with the two-line caption the view is 26 px taller than the window, so
  it scrolls; the source
  line is still on screen. Until 2026-11-18 the page cut each line with
  an ellipsis.
- **The run panel** (`side panel · run` x +20 w -20; `445:466` x +20 w
  -19; `445:478` x +20 y -6 w -19; `fields` x +20 y -8 w -19 h +8; each
  `field · …` x +20 w -19, y from -8 to -13 and +1 to +2, `field ·
  Workflow` h +15; `steps` x +20 y -5 w -19 h -22; each `step · …` x +20
  w -19 h -14, y from -5 to -13). The slot is 420 wide where Figma's
  panel is 440 (Run side panel). The field table and the steps are text
  in the library's styles (Run panel): the source column is narrower
  than Figma's 120, so "run.json, when a workflow runs it" takes three
  lines; each step is 36 high on the 4 px grid where Figma's is 50, and
  has no dot (the running step's time is green).
- **Open the session in Workbench** is disabled with a title: no
  Workbench state takes a toolkit run's session.
- **Key figures** (`kpis`, `kpi · toolkit calls`, `kpi · from headless
  runs`, `kpi · from chats`, `kpi · hook blocks`: y -6 h +22). Figma puts
  each label on its value's line, in a larger value style, and colours
  the chats' 25 cyan and the hook blocks' 25 red. `KpiTile` stacks the
  label under the value in one colour, so each tile is 86 high where
  Figma's is 80 (LIBRARY_GAPS.md, Activity KPI tile), and 102 with the
  two-line caption (Two-line caption). The tiles start 6
  higher because the rows over them are shorter (next item).
- **Kind chips, source switch and since** (`filter · chips` w -14.2;
  `source · segmented` w -15.6; `counts legend` y -4.5; `activity` y
  -6). The header and the chips are D1's, 2 px shorter in
  the library (Kind chip row, View switch 38 px); the source switch is
  the library's `ViewSwitch` with no icons, 36 high and 16 px narrower
  than Figma's 38 (View switch 38 px). Chats and Headless runs are
  enabled, as Erik approved on 2026-11-18: their labels are drawn in the
  switch's full colour, no longer dimmed as disabled, and a tap opens
  D15's or D16's view.
- **Runs** (`panel · RUNNING NOW`, `row · now and per day` and `panel ·
  CALLS PER DAY` y +16 h +70; the runs' own boxes are under Runs' lines). On
  D11 each run is a `ListRow` card 86 high, where Figma's is 78: the row's lines are 4
  apart, and its chips (`MetaChip size="sm"`) are on the 4 px grid. The
  live dot comes after the name, where Figma has it at the row's start,
  and the kind icon sits at the row's top (Activity run row). The runs'
  panel and the calls per day beside it are as tall as the taller,
  70 px taller than Figma's (22 on D11, 48 more for the wrapped lines).
  Open session is `Button size="sm" textSize="xs"`, about 114 wide against Figma's 113, with a 12 px
  label where Figma's is Medium 11 (444:543): `labelXs` is the
  library's smallest button label. The agent icons are `kind.agent`
  violet, as Figma's; the workflow icon is `kind.workflow` green where
  Figma draws it a dim #3b7468, about 40 % of that green (500:12202),
  and no icon token has that tone (Activity run row).
- **Calls per day** (`chart · Headless runs` y +13; `chart · Chats` y
  +12 h +21: 16 lower under the two-line caption). `DailyBarChart` draws
  the axis under the last chart inside it, where Figma's `axis` is its
  own layer (Activity daily chart).
- **Most called and the log** (`row · most called and log`, `panel ·
  MOST CALLED` and `panel · LOG` y +86 h -37; each `bar · …` y from +84
  down to +68; each `log · …` y +84; `source note` y +49 h +15;
  `activity` h +70; `toolkit` h +26). The row starts 86 lower, under the
  taller runs and the two-line caption. `HorizontalBarChart`
  puts its rows 24 apart, where Figma's are 26, so each row is 2 px
  closer to the one over it; its labels are in the small style in a
  column as wide as the longest, and every bar is cyan where Figma draws
  the agents violet (Most called bars). The log's lines are 16 high on
  the 4 px grid (d-072), 1 less than Figma's 17. Both panels end 37 px
  higher, and the source line follows them.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (445:137)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 445:137 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (445:142)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 445:142, as for `icon/artifacts`.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
