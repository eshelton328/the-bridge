# T11 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit T11, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityChatsTablet.ts: T9's page
with Chats picked. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame's exceptions.json excepts the strings and the `hiddenOverflow`
finding below, each with the entry that records it; with them the text
and rules checks now pass.

## Checks

- Text: fail. 4 not visible: `Harness status in omni brain` (477:1553),
  `Nov 8 · omni-brain · 2 hook blocks` (477:1554), `agents-md`
  (477:1559), `Show all 8 chats` (477:1562).
- Position: 8 of 31 layers pass. The 23 that fail: `back row` h +8;
  `source · segmented` y -5 w -15.7; `kpis` y -7; `kpi · chats` y -7;
  `kpi · toolkit calls` y -7; `kpi · hook blocks` y -7;
  `kpi · CLI · app` y -7; `run · pr-description-checker` y -5;
  `panel · calls per day` y -7 h +19;
  `panel · CHATS THAT USED THE TOOLKIT` y +12 h +69;
  `chat · Linear workflow setup for NCC team` y +7 w -8 h +18;
  `chat · Brain NC1701 project` y +21 w -8 h +18;
  `chat · Deep research on evals` y +35 w -8 h +18;
  `chat · Writer rules, skills, and agents` y +49 w -8 h +18;
  `chat · Harness status in omni brain` y +63 w -8 h +18;
  `panel · most called` y +81; `bar · writing-reviewer` y +81 w -8;
  `bar · writer` y +81 w -8; `bar · project-setup` y +81 w -8;
  `bar · ambitious` y +81 w -8; `bar · agents-md` y +81 w -8;
  `bar · readme` y +81 w -8; `bar · audit-slop` y +81 w -8. Each is
  explained below.
- Rules: fail. 1 findings: `hiddenOverflow` at
  `div.backdrop > div.app-shell__root > main.app-shell__detail > div.scroll-frame__root > div.scroll-frame__body:nth-of-type(2)`.
  Each is explained below; the frame's exceptions.json excepts it.

## Differences

- **Source switch** (`source · segmented` y -5, w -15.7). The switch is
  `ViewSwitch size="lg" tone="accent"`, 36 high and about 16 px
  narrower than Figma's 202 × 38 (View switch 38 px): the library has
  no 38 px size.
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
- **Show all 8 chats** (`Show all 8 chats` not visible). It is
  `Button variant="text" size="xs"`, 8 in from Figma's place (Show all
  link), disabled with a title: the data knows five of the eight chats.
  Under the taller chart and rows it lies under the tab bar.
- **Under the tab bar** (`Harness status in omni brain`,
  `Nov 8 · omni-brain · 2 hook blocks`, `agents-md` not visible). The
  last chat Figma shows over the tab bar, Harness status in omni brain,
  has its title cut in half at the bar's top edge: under the taller
  chart and rows it starts lower, and the opaque tab bar overlay
  (AppShell `tabBarOverlay`) covers the title's lower half and the
  line and chips under it (Activity daily chart, Activity chat row).
- **Rules and text under the tab bar** (`hiddenOverflow` at
  `main.app-shell__detail` or its `scroll-frame__body`). The page runs
  under the tab bar, as in Figma (AppShell `tabBarOverlay`), and
  scrolls; under the taller chart the last rows Figma shows over the bar
  lie under it, so their text is not visible.
