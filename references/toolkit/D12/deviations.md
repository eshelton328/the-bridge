# D12 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D12, 2026-11-18, against library 1.0.0-beta.42: a first run and
three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityRun.ts: D11's view with the
writing-reviewer run open beside it. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before the Activity view.
The frame has no exceptions.json.

## Checks

- Text: fail. 6 strings are not visible: `claude -p and the SDK, mostly
  skill evals` (445:227), `in chat “toolkit designs” · started by
  writer, step 7` (445:251), `step 4 of 8 · grade.py primary · 3 of 12
  groups` (445:271), `in chat “release notes” · started by
  pr-description` (445:290), `omni-brain` (445:489), `f-005 the-bridge`
  (445:493).
- Position: 6 of 68 layers pass. The 62 that fail: `toolkit` w -420 h
  -38; `445:154` w -420 h -2; `read-only` x -417.8 y -1.5 w -1.7 h +1;
  `view · List, Map or Activity` x -419.5 w -0.5 h -2; `filter · chips`
  y -2 w -14.2 h -2; `list tools` y -4 w -420 h -2; `source · segmented`
  y -4 w -15.6 h -2; `counts legend` x -419.4 y -4.5 w -0.6 h -1;
  `activity` y -6 w -420 h +6; `kpis` y -6 w -420 h +6; `kpi · toolkit
  calls` y -6 w -105 h +6; `kpi · from headless runs` x -105 y -6 w -105
  h +6; `kpi · from chats` x -210 y -6 w -105 h +6; `kpi · hook blocks`
  x -315 y -6 w -105 h +6; `row · now and per day` w -420 h +22; `panel
  · RUNNING NOW` w -210 h +22; `run · writing-reviewer` y -1 w -210 h
  +8; `run · skill-eval-round` y +7 w -210 h +8; `run ·
  pr-description-checker` y +15 w -210 h +8; `panel · CALLS PER DAY` x
  -210 w -210 h +22; `chart · Headless runs` x -210 y -3 w -210 h -1;
  `chart · Chats` x -210 y -4 w -210 h +21; `row · most called and log`
  y +22 w -420 h -37; `panel · MOST CALLED` y +22 w -210 h -37; `bar ·
  pr-description-checker` y +20 w -210 h -1; `bar · pr-description` y
  +18 w -210 h -1; `bar · writer` y +16 w -210 h -1; `bar · agents-md` y
  +14 w -210 h -1; `bar · writing-reviewer` y +12 w -210 h -1; `bar ·
  ambitious` y +10 w -210 h -1; `bar · readme` y +8 w -210 h -1; `bar ·
  audit-slop` y +6 w -210 h -1; `bar · readme-cold-reader` y +4 w -210 h
  -1; `panel · LOG` x -210 y +22 w -210 h -37; `log · 01:16:40` x -210 y
  +20 w -210 h -1; `log · 01:16:02` x -210 y +20 w -210 h -1; `log ·
  01:14:55` x -210 y +20 w -210 h -1; `log · 01:12:20` x -210 y +20 w
  -210 h -1; `log · 01:10:03` x -210 y +20 w -210 h -1; `log · 01:08:47`
  x -210 y +20 w -210 h -1; `log · 01:05:12` x -210 y +20 w -210 h -1;
  `log · 01:02:30` x -210 y +20 w -210 h -1; `source note` y -15 w -420
  h +15; `side panel · run` x +20 w -20; `445:466` x +20 y +1 w -19 h
  -1; `445:478` x +20 y -6 w -19; `fields` x +20 y -8 w -19 h +8; `field
  · Session` x +20 y -8 w -19 h -1; `field · Project` x +20 y -9 w -19 h
  -1; `field · Feature` x +20 y -10 w -19 h -2; `field · Started by` x
  +20 y -12 w -19 h -1; `field · Workflow` x +20 y -13 w -19 h +15;
  `field · Model` x +20 y +2 w -19; `field · Tokens` x +20 y +2 w -19;
  `field · Cost` x +20 y +2 w -19 h -1; `field · Toolkit version` x +20
  y +1 w -19 h -1; `steps` x +20 y -5 w -19 h -22; `step · 0:00` x +20 y
  -5 w -19 h -14; `step · 0:21` x +20 y -7 w -19 h -14; `step · 0:24` x
  +20 y -9 w -19 h -14; `step · 0:58` x +20 y -11 w -19 h -14; `step ·
  1:42` x +20 y -13 w -19 h -14. Each is explained below.
- Rules: fail. 6 findings: `hiddenOverflow` at `[data-figma="kpi · from
  headless runs"] > dl.kpi-tile__root >
  dd.kpi-tile__caption:nth-of-type(2) > span.truncated-text`;
  `hiddenOverflow` at `[data-figma="run · writing-reviewer"] >
  div.list-row__root > div.list-row__body > div.list-row__lines > span`;
  `hiddenOverflow` at `div.list-row__lines > div.inline >
  span.meta-chip__root:nth-of-type(1) > span.meta-chip__label >
  span.truncated-text`; `hiddenOverflow` at `div.list-row__lines >
  div.inline > span.meta-chip__root:nth-of-type(2) >
  span.meta-chip__label > span.truncated-text`; `hiddenOverflow` at
  `[data-figma="run · skill-eval-round"] > div.list-row__root >
  div.list-row__body > div.list-row__lines > span`; `hiddenOverflow` at
  `[data-figma="run · pr-description-checker"] > div.list-row__root >
  div.list-row__body > div.list-row__lines > span`. Each is explained
  below; this frame takes no exceptions.

## Differences

- **The view under the panel** (`toolkit` w -420 h -38; `445:154` w
  -420; `read-only` x -417.8; `view · List, Map or Activity` x -419.5;
  `list tools` w -420; `counts legend` x -419.4; `activity`, `kpis` and
  the two rows w -420; each `kpi · …` x and w by 105; each panel, chart,
  `bar · …` and `log · …` w -210, the right column's x -210; `source
  note` w -420 h +15). Figma lays its 440 px panel over the view, which
  keeps its width under it. The library's `AppShell` has a side slot of
  420 and narrows the detail beside it, so the view is 420 px narrower
  and the source line wraps to two lines (Run side panel).
- **Text cut by the narrower view** (not visible: `claude -p and the
  SDK, mostly skill evals`, the three runs' lines, `omni-brain` and
  `f-005 the-bridge`; rules: the six `hiddenOverflow` findings in `kpi ·
  from headless runs` and the three runs). In the narrower view the
  caption, the runs' lines and the first run's chips end with an
  ellipsis, as `KpiTile`, `ListRow` and `MetaChip` cut a line too long
  for them. `omni-brain` and `f-005 the-bridge` are both a chip of the
  first run and a value of the panel; with the chips cut, the render
  shows each whole once where Figma has it twice, so one of its two
  layers (445:489, 445:493) counts as not visible. Figma has the room because its view keeps its
  width (Run side panel).
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
  than Figma's 38 (View switch 38 px). Chats and Headless runs are drawn
  disabled: they have no counts until T11 and T12.
- **Runs** (`run · writing-reviewer` h +8, `run · skill-eval-round` y +7
  h +8, `run · pr-description-checker` y +15 h +8; `panel · RUNNING NOW`,
  `row · now and per day` and `panel · CALLS PER DAY` h +22). Each run
  is a `ListRow` card 86 high, where Figma's is 78: the row's lines are 4
  apart, and its chips (`MetaChip size="sm"`) are on the 4 px grid. The
  live dot comes after the name, where Figma has it at the row's start,
  and the kind icon sits at the row's top (Activity run row). The runs'
  panel and the calls per day beside it are as tall as the taller,
  22 px taller than Figma's.
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
