# T09 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit T09, 2026-11-18, against library 1.0.0-beta.42: a first run and
three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityTablet.ts: the tablet's
Activity page under Back to Toolkit. A tap on a run opens it on a page
of its own, which no frame draws. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before the Activity view.
The frame has no exceptions.json.

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 8 of 24 layers pass. The 16 that fail: `back row` x +2 w -4
  h +8; `source · segmented` x +2 y -5 w -15.7 h -2; `kpis` x +2 y -7 w
  -4 h +4; `kpi · toolkit calls` x +2 y -7 w -1 h +4; `kpi · headless
  runs` x +1 y -7 w -1 h +4; `kpi · from chats` y -7 w -1 h +4; `kpi ·
  hook blocks` x -1 y -7 w -1 h +4; `run · skill-eval-round` x +2 y -5 w
  -4 h -1; `run · pr-description-checker` x +2 y -6 w -4 h -1; `panel ·
  calls per day` x +2 y -8 w -4 h +40; `panel · most called` x +2 y +32
  w -4 h -1; `bar · pr-description-checker` x +4 y +32 w -8 h -1; `bar ·
  pr-description` x +4 y +32 w -8 h -1; `bar · writer` x +4 y +32 w -8 h
  -1; `bar · agents-md` x +4 y +32 w -8 h -1; `bar · writing-reviewer` x
  +4 y +32 w -8 h -1. Each is explained below.
- Rules: pass.

## Differences

- **Back row** (`back row` x +2 w -4 h +8). The library's `BackRow` is
  28 high, where Figma's row is 20; the tablet's `DetailFrame` pads 24
  where Figma's item starts 22 in (Tablet item spacing).
- **Source switch and key figures** (`source · segmented` x +2 y -5 w
  -15.7 h -2; `kpis` and each `kpi · …` y -7 h +4, x and w within 2).
  The switch is `ViewSwitch` 36 high and 16 px narrower (View switch 38
  px); each tile is 68 high where Figma's is 64, and the values are in
  one colour (Activity KPI tile). Chats and Headless are enabled, as
  Erik approved on 2026-11-18: their labels are drawn in the switch's
  full colour, no longer dimmed as disabled, and a tap opens T11's or
  T12's view.
- **Runs** (`run · skill-eval-round` y -5 h -1, `run ·
  pr-description-checker` y -6 h -1). Each `ListRow` card is 58 high
  where Figma's is 59; the dot comes after the name and the kind icon
  sits at the row's top. The agent icons are `kind.agent` violet, as
  Figma's; the workflow icon is `kind.workflow` green where Figma draws
  it a dim #3b7468, about 40 % of that green (500:12772), and no icon
  token has that tone (Activity run row).
- **Calls per day** (`panel · calls per day` y -8 h +40). The library's
  chart is 78 high where the tablet's bars are 56 (Activity daily chart).
- **Most called** (`panel · most called` y +32; each `bar · …` x +4 y
  +32 w -8). The panel starts 32 lower under the taller chart. The
  buttons over the rows start at the chart's edge, 4 in from Figma's
  label frame; every bar is cyan and the labels are in the small style.
  Figma's labels are in a 200 px column (`label` 449:333, x 37 to 237)
  with the bars from x 245 (449:338), the longest 434 wide; the chart
  sizes its label column to its longest label and takes no width, so
  the bars start 52 px further left (x 193) and are 13 % longer (492
  wide) (Most called bars).
