# M13 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
  toolkit M13, 2026-11-18, against library 1.0.0-beta.42: a first run
  and three fix rounds), each with its reason. The state is
  web/src/pages/toolkit/states/toolkitActivityChatsPhone.ts: M10's view
  with Chats picked. The library gaps are in
  web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
  the same text, position and rule results as before these frames. The
  frame has no exceptions.json.

## Checks

- Text: fail. 3 not visible: `Nov 13 · omni-brain` (477:2231),
  `writing-reviewer ×2` (477:2237), `readme` (477:2249).
- Position: 15 of 32 layers pass. The 17 that fail: `toolkit` h +619;
  `source · segmented` w -15.7; `kpis` h +8; `panel · calls per day` h
  +31; `panel · CHATS THAT USED THE TOOLKIT` y +33 h +87;
  `chat · Linear workflow setup for NCC team` y +28 h +18;
  `chat · Brain NC1701 project` y +42 h +16;
  `chat · Deep research on evals` y +54 h +52;
  `chat · Writer rules, skills, and agents` y +102 h +18;
  `panel · most called` y +120; `bar · writing-reviewer` y +120;
  `bar · writer` y +120; `bar · project-setup` y +120; `bar · ambitious`
  y +120; `bar · agents-md` y +120; `bar · readme` y +120;
  `bar · audit-slop` y +120. Each is explained below.
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
- **Page** (`toolkit` h +619). Figma's `toolkit` ends at the tab bar;
  the render's section holds the whole list and Most called, which run
  under the bar, as in Figma.
- **Under the tab bar** (`Nov 13 · omni-brain`, `writing-reviewer ×2`,
  `readme` not visible). Brain NC1701 project's chips wrap to three
  lines on the phone, as Figma's, and with the taller chart and rows
  they lie under the bar.
- **Show all 8 chats** waits, disabled with a title (Show all link); it
  lies under the tab bar, as in Figma.
- **Rules and text under the tab bar** (`hiddenOverflow` at
  `main.app-shell__detail` or its `scroll-frame__body`). The page runs
  under the tab bar, as in Figma (AppShell `tabBarOverlay`), and
  scrolls; under the taller chart the last rows Figma shows over the bar
  lie under it, so their text is not visible.
