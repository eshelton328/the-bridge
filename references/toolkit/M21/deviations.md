# M21 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M21 D03 D04 D07 D08 D09 T03 M02 T07 M20 T18`,
2026-11-17, against library 1.0.0-beta.19, the version this branch
installs), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowOpenPhone.ts`: D8's data
(`workflowOpen`), with skill-eval-round open. On the phone the item
replaces the list in the shared `DetailFrame` (d-107), as on M02 and M20.
The flow is too wide for the phone, so `ToolkitWorkflowFlow` draws no
steps by phase (`steps={false}`): the steps' header and the agents' row
stay, and the flow's `elsewhere` line (487:2275) says the steps are on How
it works. `web/src/app/ToolkitStickyBack.test.tsx` checks that the phone
draws no flow, that the header and the agents' row scroll sideways inside
the item's width and that the item does not. D03, D04, D07, D08, D09, T03,
M02, T07, M20 and T18 give the same results as before M21 (every text,
position delta and rule finding).

## Checks

- Text: fail. Every Figma string is in the render; no extra text and no
  covered text. One string is not visible: `Evals` (487:1740), see Item
  tabs.
- Position: 14 of 23 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `487:1722`, `path badge`, `487:1862`,
  `kind section · workflow`, `steps header`, `runs`,
  `link · eval-grader`, `487:2275`, `preview bar`, `tab bar`). The 9 that
  fail are listed below: `button · Discuss`, `toolkit`,
  `button · Open full page`, `columns`, `file preview`,
  `rendered markdown`, `side`, `files` and `file · skill-eval-round.md`.
- Rules: fail. Three `hiddenOverflow` findings: the item tabs' list
  (`div.item-tabs__list`), the steps' header (`[data-figma="steps header"]`)
  and the agents' row (`[data-figma="runs"]`); see Item tabs and One-line
  rows.

## Deviations

- **One-line rows.** As in Figma, the steps' header and the agents' row
  are one line each and run past the item's right edge (378): Figma's
  `toolkit` frame cuts Open full page after "Ope" and the note `Gates in
  amber; G1 and G6 run after step 1.` after "G6 r". The render cuts both
  rows at the same edge, and each row scrolls sideways to its rest, so
  Open full page stays reachable and the item never scrolls sideways.
  Each row's sideways scroll is a `hiddenOverflow` finding
  (`[data-figma="steps header"]`, `[data-figma="runs"]`), which Figma's
  cut has too. Both rows pass the position check.
- **Open full page.** `Button size="sm"` is 127.5 × 28 with a 16 px icon
  against Figma's 122 × 29 with a 13 px `icon/ext`
  (`button · Open full page` w +5.5). Gap: Workflow flow by phase.
- **Item tabs.** Figma's tabs are 10 px in at the sides with no list
  padding, so Evals ends at 378 and only Activity runs past the screen.
  `ItemTabs` pads its list 2 and each tab 12, so the row is about 35 px
  longer and Evals is cut at the screen's edge (`Evals` not visible; the
  list's sideways scroll is the `hiddenOverflow` finding on
  `div.item-tabs__list`, which Figma's row has too). Gap: Item tab
  spacing.
- **Selected tab tone.** Figma's selected tab, Overview, has a cyan
  label; the render's label is white with the cyan border. A library
  release adds the prop. Gap: Item tab selected tone.
- **Rendered file.** Figma's file is 16 px in from the box, with the
  title 14 under the bar; `MarkdownView` pads 20 by 24, so the text is
  narrower and the box 17 px taller (`rendered markdown` h +17,
  `file preview` h +17). No space token has 14. Gap: File preview.
- **Columns height.** Figma's `columns` (487:1971) is 200 high, 40 px
  shorter than the file preview inside it (240). The render's columns
  hold the preview, 257 high (`columns` h +57). Gap: File preview.
- **Side and files.** With the preview 17 px taller and the side 12
  under it, the side starts 16 px lower (`side` y +16, `files` y +16,
  `file · skill-eval-round.md` y +19). Figma draws the side 1 px high;
  the render's side holds the files list (`side` h +41). The files list
  is as wide as its line, where Figma's layer spans the column (`files`
  w -139.6). The file line still ends above the tab bar, so nothing
  scrolls. Gap: Item file summary.
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), as on M02 and M20.
  Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (487:1703) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends under its last part, 12 over the tab
  bar (`toolkit` y +36, h -48). This is the d-107 structure that keeps
  Back in view, as on M02 and M20.
- **Copy button.** As on M02 and M20: the copy icon is a plain button
  with `CopyIcon`. Gap: Path badge copy button.
- **Tab bar.** The shared `AppTabBar` passes the position check. No
  string lies under it in Figma or in the render.

## Second review

- **Agent link chip.** The `eval-grader` chip has a grey border where
  Figma's is the agent purple, and it is about 3 px taller with a
  slightly larger label. It is a secondary `Button` (gap: Agent link
  chip).
