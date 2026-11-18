# D15 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit D15, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityChats.ts: D11's view with
Chats picked. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame has no exceptions.json.

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 12 of 41 layers pass. The 29 that fail: `toolkit` h -10;
  `filter · chips` w -14.2; `source · segmented` w -15.6;
  `counts legend` y -4.5; `activity` y -6 h +34; `kpis` y -6 h +6;
  `kpi · chats` y -6 h +6; `kpi · toolkit calls` y -6 h +6;
  `kpi · hook blocks` y -6 h +6; `kpi · CLI · app` y -6 h +6;
  `row · now and per day` h +16; `panel · RUNNING NOW` h +16;
  `run · writing-reviewer` h +8; `run · pr-description-checker` y +7 h
  +8; `panel · CALLS PER DAY` h +16; `chart · Chats` h +21;
  `row · most called and log` y +16 h +13;
  `panel · CHATS THAT USED THE TOOLKIT` y +16 h +13;
  `chat · Linear workflow setup for NCC team` y +15 h +7;
  `chat · Brain NC1701 project` y +22 h +6;
  `chat · Deep research on evals` y +28 h +7;
  `chat · Writer rules, skills, and agents` y +35 h +7;
  `panel · MOST CALLED` y +16 h +13; `bar · writing-reviewer` y +14;
  `bar · writer` y +12; `bar · project-setup` y +10; `bar · ambitious` y
  +8; `bar · agents-md` y +6; `source note` y +29. Each is explained
  below.
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
- **Show all 8 chats** waits, disabled with a title: the data knows five
  of the eight chats, and no frame lists the other three.
- **Page and source line** (`toolkit` h -10; `activity` y -6 h +34;
  `row · most called and log` y +16 h +13; `source note` y +29). The
  rows over them are taller, so the source line is lower; the page
  section ends with it.
- **Sources in D11.** Chats and Headless runs are enabled in this
  frame's state and the eight others of this branch; D11, D12, T9 and
  M10 keep them disabled, because their tests assert it (reported to the
  caller).
