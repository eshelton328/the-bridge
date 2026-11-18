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
delta and rule finding).

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. Three strings are not visible: `Evals` (487:1492, see
  Item tabs), and the prompt's first paragraph `You review one draft for
  a reader who has none of its author’s context. You see what that reader
  will see: the draft, and the sources a careful reader could open to
  check it.` (487:1663) and `Inputs` (487:1664), see Under the tab bar.
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
  workflows and Files lie under it. The render scrolls the item in the
  DetailFrame body and cuts it at the same place: the paragraph
  (487:1663) and `Inputs` (487:1664) are cut or scrolled away, as in
  Figma, so the text check counts them as not visible, and the rule check
  reports the scrolling body as `hiddenOverflow`. These stay as failures
  for Erik to accept (no `exceptions.json`), as on M02.
- **Item tabs.** Figma's tabs are 10 px in at the sides with no list
  padding, so Evals ends at 378 and only Activity runs past the screen.
  `ItemTabs` pads its list 2 and each tab 12, so the row is about 35 px
  longer and Evals is cut at the screen's edge (`Evals` not visible; the
  list's sideways scroll is the second `hiddenOverflow`, which Figma's
  row has too). Gap: Item tab spacing.
- **Selected tab tone.** Figma's selected tab, Overview, has a cyan
  label; the render's label is white with the cyan border. A library PR
  adds `ItemTabs tone="accent"`. Gap: Item tab selected tone.
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
