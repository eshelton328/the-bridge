# D18 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D18, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityChat.ts: D15 with Writer
rules, skills, and agents open in the side slot. The library gaps are
in web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame
gives the same text, position and rule results as before these frames.
The frame's exceptions.json excepts the strings and the `hiddenOverflow`
findings below, each with the entry that records it; with them the text
and rules checks now pass.

## Checks

From `pnpm fidelity toolkit --checks text,rules` on 2026-11-18, against
library 1.0.0-beta.58, after the runs' lines wrap (see Runs).

- Text: fail. 2 not visible:
  `Counts, titles and items come from the Claude Code session files on this Mac, Oct 31 to Nov 15; running now is sample data. Chats are sessions from the CLI or the desktop app.`
  (478:482), `Writer rules, skills, and agents` (475:378).
- Position: 6 of 61 layers pass. The 55 that fail: `toolkit` w -420 h
  +66; `478:192` w -420; `read-only` x -417.8; `view · List, Map or
  Activity` x -419.5; `filter · chips` w -14.2; `list tools` w -420;
  `source · segmented` w -15.6; `counts legend` x -419.4 y -4.5;
  `activity` y -6 w -420 h +110; `kpis` y -6 w -420 h +6; `kpi · chats`
  y -6 w -105 h +6; `kpi · toolkit calls` x -105 y -6 w -105 h +6; `kpi
  · hook blocks` x -210 y -6 w -105 h +6; `kpi · CLI · app` x -315 y -6
  w -105 h +6; `row · now and per day` w -420 h +48; `panel · RUNNING
  NOW` w -210 h +48; `run · writing-reviewer` w -210 h +24; `run ·
  pr-description-checker` y +23 w -210 h +24; `panel · CALLS PER DAY` x
  -210 w -210 h +48; `chart · Chats` x -210 w -210 h +21; `row · most
  called and log` y +48 w -420 h +57; `panel · CHATS THAT USED THE
  TOOLKIT` y +48 w -210 h +57; `chat · Linear workflow setup for NCC
  team` y +47 w -210 h +7; `chat · Brain NC1701 project` y +54 w -210 h
  +6; `chat · Deep research on evals` y +60 w -210 h +29; `chat · Writer
  rules, skills, and agents` y +89 w -210 h +27; `panel · MOST CALLED` x
  -210 y +48 w -210 h +57; `bar · writing-reviewer` x -210 y +46 w -210;
  `bar · writer` x -210 y +44 w -210; `bar · project-setup` x -210 y +42
  w -210; `bar · ambitious` x -210 y +40 w -210; `bar · agents-md` x
  -210 y +38 w -210; `bar · readme` x -210 y +36 w -210; `bar ·
  audit-slop` x -210 y +34 w -210; `source note` y +105 w -420; `side
  panel · chat` x +20 w -20; `475:374` x +20 w -19; `475:386` x +20 y -6
  w -19; `fields` x +20 y -8 w -19; `field · Started` x +20 y -8 w -19;
  `field · Length` x +20 y -9 w -19; `field · Project` x +20 y -11 w
  -19; `field · From` x +20 y -14 w -19 h +15; `field · Model` x +20 w
  -19; `field · Messages` x +20 w -19; `field · Tokens` x +20 w -19;
  `field · Hook blocks` x +20 w -19; `toolkit items` x +20 y -10 w +6.8;
  `478:485` x +20 y -10 w +6.8; `steps` x +20 y -16 w -19; `tool · Bash`
  x +20 y -16 w -19; `tool · Agent` x +20 y -16 w -19; `tool ·
  SendMessage` x +20 y -16 w -19; `tool · Write` x +20 y -16 w -19;
  `tool · Edit` x +20 y -16 w -19. Each is explained below.
- Rules: fail. 2 findings: `hiddenOverflow` at
  `div > div.backdrop > div.backdrop > div.app-shell__root > main.app-shell__detail`;
  `hiddenOverflow` at `[data-figma="475:374"] > h2`. Each is explained
  below; the frame's exceptions.json excepts them.

## Differences

- **Side panel** (`side panel · chat` x +20 w -20; every part of the
  view w -420, its panels w -210, the right column x -210; `toolkit` w
  -420; `478:192` w -420; `read-only`, `view · List, Map or Activity`
  and `counts legend` x about -419). Figma lays a 440 px panel over the
  view; AppShell's side slot is 420 and narrows the view beside it (Run
  side panel). The runs' lines wrap to two lines (see Runs), and the
  view is taller: the source line
  (`Counts, titles and items come from the Claude Code session files on this Mac, Oct 31 to Nov 15; running now is sample data. Chats are sessions from the CLI or the desktop app.`)
  lies under the window's foot (`source note` y +105; `activity` h +110;
  `toolkit` h +66;
  rules `hiddenOverflow` at `main.app-shell__detail`).
- **Chat title** (`Writer rules, skills, and agents` not visible; rules
  `hiddenOverflow` at `[data-figma="475:374"] > h2`). Figma ends the
  title with an ellipsis before the badge too (475:378 is 248 wide); the
  render does the same in a 20 px narrower panel.
- **Key figures** (`kpis` and each `kpi · …`: y -6 h +6 on the desktop,
  y -7 on a tablet, h +8 two by two on the phone). `KpiTile` stacks the
  label under the value in one colour, where Figma puts the label on the
  value's line and draws the 8 hook blocks red (Activity KPI tile). The
  tiles start higher because the rows over them are shorter.
- **Runs** (`run · writing-reviewer` h +24 and
  `run · pr-description-checker` y +23 h +24 on the desktop; y -5 on a
  tablet). Each run is a `ListRow` card 86 high on D15, where Figma's is
  78; the live dot comes after the name and the kind icon sits at the
  row's top (Activity run row). In the view narrowed by the side slot
  the line under each run's name wraps to two lines, so every word
  shows, where Figma's wider view has one line; until 2026-11-18 the
  page cut it with an ellipsis. Each run is 16 px taller again. The
  runs' panel and the calls per day beside it are as tall as the
  taller, 48 px taller than Figma's (`row · now and per day`,
  `panel · RUNNING NOW`, `panel · CALLS PER DAY` h +48), and every part
  under them starts 48 lower (`row · most called and log`,
  `panel · CHATS THAT USED THE TOOLKIT` and `panel · MOST CALLED` y +48;
  each `chat · …` y +47 to +89; each `bar · …` y +46 to +34).
- **Calls per day** (`chart · …` h +21 on the desktop;
  `panel · calls per day` h +19 on a tablet, h +31 on the phone).
  `DailyBarChart` draws its own axis and is 78 high on every layout,
  where Figma's bars are 56 on a tablet and 44 on the phone (Activity
  daily chart). Every part under it starts that much lower.
- **Chats** (each `chat · …`; `panel · CHATS THAT USED THE TOOLKIT`).
  Each chat is a `ListRow` (`padding="sm"`) with the items as `MapNode`
  chips in its actions: the actions start 4 under the title, so each
  desktop row is about 7 px taller than Figma's 67, and on a tablet and
  the phone, where the line on when and where it ran stands over the
  chips, about 18 px taller (Activity chat row). Each chip is a
  `MapNode` 28 high, with the library's icon, about 6 px wider than
  Figma's (Activity item chip). Hover fills the row's line behind its
  content; the selected chat has `ListRow`'s selected colours.
- **Most called** (`panel · MOST CALLED` or `panel · most called` and
  each `bar · …`). `HorizontalBarChart` puts its rows 24 apart where
  Figma's desktop rows are 26, so each row is 2 px closer to the one
  over it; its labels are in the small style in a column as wide as the
  longest, and every bar is cyan where Figma draws the agents violet
  (Most called bars). On a tablet the rows are 8 px narrower: the panel
  pads 16 at the sides where Figma pads 15 and 16.
- **Open chat** (`side panel · chat`, `fields`, each `field · …`,
  `toolkit items`, `steps`, each `tool · …`). Figma's parts are 14
  apart; no spacing token has 14, so they are 12 apart and each part
  starts 2 px higher than the one before it. Each field row is a px
  shorter, as the library's small text keeps 16 px lines (d-072), and
  the fields are a `dl` in the library's styles (Run panel). The tools
  have no dot between the count and the name: the library has no step
  dot (Run panel). The items chip is a `MapNode` (Activity item chip).
  Open the session in Workbench is disabled with a title: no Workbench
  state takes a toolkit chat.
- **Fields** (`field · From` h +15). In the narrower panel Claude Code
  CLI 2.1.319 wraps to a second line.
- **Chat rows** (`chat · Deep research on evals` h +29,
  `chat · Writer rules, skills, and agents` y +89 h +27). In the
  narrower view Brain NC1701 project and Deep research on evals wrap
  their chips to a second line, and the selected row, Writer rules,
  skills, and agents, puts its writing-reviewer ×9 chip on a third line
  under Nov 8 · omni-brain · 4 hook blocks, where Figma has it on that
  line. Figma lays the 440 px chat panel over a full-width view, so
  the row is 650 wide (`chat · Writer rules, skills, and agents`
  478:412); AppShell's 420 side slot narrows the view beside it, so
  the row is about 440 wide and the line and the chip do not fit side
  by side (Run side panel, Activity chat row).
- **Header, chips and source switch** (`filter · chips` w -14.2;
  `source · segmented` w -15.6, y -4 or -5 on a tablet; `counts legend`
  y -4.5). The chips are D1's, 2 px shorter in the library (Kind chip
  row); the switch is `ViewSwitch` 36 high and 16 px narrower than
  Figma's 38 (View switch 38 px).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (478:175)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 478:175 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (478:180)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 478:180, as for `icon/artifacts`.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
