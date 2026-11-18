# M20 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit M20 D03 D04 D07 D08 D09 T03 M02 T07`,
2026-11-17, against library 1.0.0-beta.19, the version this branch
installs), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentOpenPhone.ts`: D7's data
(`agentOpen`), with writing-reviewer open. On the phone the item replaces
the list in the shared `DetailFrame` (d-107), as on M02, and the four How
it runs cards sit two across (`ToolkitAgentRuns` `columns="2"`);
`web/src/app/ToolkitStickyBack.test.tsx` checks the two columns and that
Back stays in view while the agent scrolls. D03, D04, D07, D08, D09, T03,
M02 and T07 give the same results as before M20 (every text, position
delta and rule finding). The Checks below are from a rerun with library
1.0.0-beta.25 and the item tabs' `tone` and `density` props
(2026-11-17).

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. The prompt's first paragraph (487:1663) and `Inputs`
  (487:1664) pass since the tab bar lies over the page (see Under the
  tab bar).
- Position: 20 of 29 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `487:1474`, `path badge`, `487:1613`,
  `kind section · agent`, `facts`, `fact · Claude`, `fact · Codex`,
  `fact · Tools`, `fact · Context`, `preview bar`, `tab bar`). The 9 that
  fail are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: fail. Three `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`), the item tabs' list
  (`div.item-tabs__list`) and the file preview
  (`[data-figma="file preview"]`); see Under the tab bar, Item tabs and
  Preview bar.

## Deviations

- **Under the tab bar.** Figma draws the item down to the file line
  (y 995), past the tab bar at y 767, so the prompt's first paragraph is
  cut by the bar's top edge and `Inputs`, its paragraph, Used in
  workflows and Files lie under it. The tab bar lies over the page
  (AppShell `tabBarOverlay`, library 1.0.0-beta.26): the DetailFrame
  body runs under the bar as Figma's item does, so the paragraph
  (487:1663) and `Inputs` (487:1664) lie under the bar in both and the
  text check passes them. The rest of the item scrolls, and the rule
  check reports the scrolling body as `hiddenOverflow`; it stays as a
  failure for Erik to accept (no `exceptions.json`), as on M02.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's, so Evals ends inside the
  390 px screen and only Activity runs past it (the list's sideways scroll is the second `hiddenOverflow`, which Figma's
  row has too). The outline stays `border.selected` at half alpha where
  Figma's is solid cyan (no solid selected token, d-050).
- **Preview bar.** As in Figma, the bar is one line: the name, then
  `137 lines · the prompt`, and the lock and Read-only run past the box's
  right edge, where the box cuts them (Figma's Read-only, 487:1660,
  starts at 390, past the 378 px box). The box's cut is the third
  `hiddenOverflow`. The bar's box passes. Gap: File preview.
- **Rendered prompt.** Figma's prompt is 16 px in from the box, with the
  title 14 under the bar; `MarkdownView` pads 20 by 24, so the text is
  16 px narrower, its lines break earlier and the box is 17 px taller
  (`rendered markdown` h +17, `file preview` h +17). No space token has
  14. Gap: File preview.
- **Columns height.** Figma's `columns` (487:1648) is 240 high, 40 px
  shorter than the file preview inside it (280). The render's columns
  hold the preview, 297 high (`columns` h +57). Gap: File preview.
- **Side and files.** With the preview 17 px taller, the side starts
  13 px lower (`side` y +13, `used in workflows` y +13, `files` y +10,
  `file · writing-reviewer.md` y +13), all under the tab bar. Figma draws
  the side 1 px high; the render's side holds its two sections
  (`side` h +77). The files list is as wide as its line, where Figma's
  layer spans the column (`files` w -132.4). Gap: Item file summary.
- **How it runs cards.** The four cards are 178 wide, two across and
  10 apart both ways, and pass the position check. The `Panel` pads 16 at
  the sides against Figma's 15, so `Bash, Read, Grep, Glob` wraps to two
  lines and the Tools card is taller than the Claude card beside it;
  the one-line cards are as tall as their content, where Figma makes each
  row's cards as tall as the tallest, and the icons are 16 px against 14.
  Gap: Agent fact card.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), as on M02. Gap: Item
  action buttons.
- **Item frame.** Figma's `toolkit` (487:1455) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to its last part (`toolkit` y +36,
  h +204). This is the d-107 structure that keeps Back in view, as on
  M02.
- **Copy button.** As on M02: the copy icon is a plain button with
  `CopyIcon`. Gap: Path badge copy button.
- **Tab bar.** The shared `AppTabBar` passes the position check.

## Second review

- **Fact card heights.** The two cards in each row of the How it runs
  grid end at different heights (Codex about 17 px below Claude, Tools
  about 16 px below Context), where Figma's are all 108 px high. A
  `Panel` is only as tall as its content (gap: Agent fact card).

## Text under the tab bar

bridge-coord decided (2026-11-17) that this frame gets no
`exceptions.json` for hidden text. Measured cause of each such failure:

- Figma draws the tab bar (`tab bar`, y 767) after these text layers, so
  `coveredInFigma` counts them as covered. The render does not draw
  them under the tab bar: the item's scroll body ends at the tab bar's
  top edge and clips them (`hiddenOverflow` on
  `main.app-shell__detail`). The text check accepts a covered Figma
  string only when the render covers it too, so it reports them as not
  visible. The reference is correct; the difference is the app frame,
  which ends the scroll body above the tab bar where Figma runs the
  content under it. A change there is a shared-frame change
  (bridge-coord). The text check stays failing.
- The prompt's paragraph and Inputs also start lower than Figma's,
  because `MarkdownView` pads 20 by 24 where Figma has 14 by 16 (gap:
  File preview).
