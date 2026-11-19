# T18 deviations

What still differs from Figma after the last fidelity run
(`pnpm fidelity toolkit T18`, 2026-11-17, against library 1.0.0-beta.19,
the version this branch installs), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowOpenTablet.ts`: D8's data
(`workflowOpen`), with skill-eval-round open on its Overview tab. On a
tablet the item replaces the list in the shared `DetailFrame` (d-107), and
the steps by phase are `ToolkitWorkflowFlow size="sm"`. D03, D04, D07, D08,
D09, T03, M02, T07 and M20 give the same results as before this change
(every text, position delta and rule finding). The Checks below are from
a rerun with library 1.0.0-beta.25 and the item tabs' `tone` and
`density` props (2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible, with no
  extra and no covered text. Nothing is under the tab bar and nothing
  scrolls: the item's last line (the file line) ends above the tab bar.
- Position: 15 of 41 layers pass: `back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `487:759` (the
  description), `steps header` and `tab bar`. The 26 that fail are listed
  below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass.

## Deviations

- **Small text in the flow.** Figma draws the tablet's flow smaller than
  D8's: card titles about 11 px, the mono line and the notes about 9 px,
  so every line fits in the 147 px card and each card is 62 high. The
  smallest text styles the library has are `labelXs` (12 px) and
  `smallXs` and `monoSm` (11 px), and the step mark is a `Badge` 22 high
  against Figma's 14.5 (gap: Workflow flow (tablet)). At 11 px three notes
  wrap to two lines (`each case × model × repeat`,
  `own family, 20 runs or more`, `hides which runs had the skill`), and
  because every card row has one size, each card is 88 high against 62.
  So each step card is 26 px taller and the second and third rows start
  27 and 53 px lower (`step · Pre-registered?`, `step · Stop`,
  `step · Runs`, `step · Facts`, `step · Blinding`,
  `step · Primary grades`, `step · Second grades`, `step · Aggregate`,
  `step · Read`, `step · Owner decides`: h +26.4, y +26.9 or +53.2), and
  the flow is 79 px taller (`flow · by phase` h +78.6,
  `kind section · workflow` h +78.6). Every row under it starts about
  80 px lower: `runs` y +79.6, `link · eval-grader` y +79.6, `columns`
  y +82.6, `file preview` y +82.6, `preview bar` y +82.6,
  `rendered markdown` y +82.6, `side` y +99.6, `files` y +99.6 and
  `file · skill-eval-round.md` y +102.6. The lanes and cards are in
  place across: each card's x and width are within 3 px of Figma's.
- **Connector lines.** As on D8, the straight arrows are the library's
  `FlowLine` (library #133 and #137), across in 16 px columns and down in
  the 12 px between cards, and the long amber line down the Check lane
  from the gate to Stop with `no` beside it, in `small` text (12/16)
  against Figma's smaller label. The elbows from Blinding into the grades
  and from Second grades into Aggregate are the library's `FlowElbow`, and
  the dashed loop from Owner decides up into Stop's foot is
  `FlowLoop end="up"` (library #144, beta.36), with `new failure` on the
  line, as on D8.
- **Loop label.** The `new failure` label is a `Badge variant="tag"` in
  12 px mono, 91 × 20 against Figma's 74 × 18 bordered pill, on the box's
  colour so the dashed line does not show through it, and it sits
  79 px lower with the taller flow (`label · new failure` x -8.8, y +77.3,
  w +17.7; gaps: Workflow flow by phase, Workflow flow (tablet)).
- **Open full page.** `Button size="sm"` with its 16 px icon is 127.5 ×
  28 against Figma's 122 × 29, so it starts 7.5 px further left
  (`button · Open full page` x -7.5, w +5.5), as on D8 (gap: Workflow
  flow by phase).
- **Item frame.** Figma's `toolkit item` (487:589) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item`
  y +32, h -56). This is the d-107 structure that keeps Back in view, as
  on T03 and T07.
- **Back row.** The back row is 32 px high against Figma's 36, because the
  `md` buttons are 32 high (gap: Item action buttons), and its content is
  24 px in from the sides where Figma has 22 (gap: Tablet item spacing).
  Discuss is 99.5 px wide against 97, so it starts 5 px further left
  (`button · Discuss` x -5.1), as on T03 and T07.
- **Title width.** The title skill-eval-round is 211.7 px wide and 40 high
  against Figma's 197 and 38 (`487:612` w +14.7): the `heading` glyphs
  and line height, as on T07. It starts in place.
- **Rendered file.** Figma keeps the file's text 524 px wide inside the
  712 px preview, so the first paragraph has two lines; `MarkdownView`
  fills its box, so the paragraph has two longer lines (gap: Rendered file
  text width), and its padding (20 by 24 against 14 by 16) makes the
  preview 17 px taller (`columns`, `file preview` and `rendered markdown`
  h +17; gap: File preview).
- **Side under the file.** Figma draws the side (487:886) 1 px high,
  where the render's side holds Files (`side` h +41). The files list is
  as wide as its longest line, where Figma's layer spans the column
  (`files` w -485.6; gap: Item file summary), as on T03 and T07.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and since library #153 (beta.42) each tab is
  within 1.1 px of Figma's width: the tabs start at 24 against 22 (the
  Container's 24 px side), and Activity ends at 462.3 against 463. The
  item adds 4 above the panel, so the description stays in place. The
  How it works, Files, Links, Evals and Activity panels are later
  frames.
- **Row spacing.** Figma's rows from the meta row to the columns are
  14 px apart; no space token has 14. The item uses 20 above the meta row
  and 12 between the rows, as on T03 and T07 (gap: Tablet item spacing).
- **Copy button and preview bar.** As on D8: the copy icon is a plain
  button with `CopyIcon` (gap: Path badge copy button), and the preview
  box and bar are drawn by the library's `FileFrame` (gap: File preview).

## Second review

- **Flow text size.** The lane labels, step titles and step notes in the
  flow are larger than Figma's (for example "Primary grades" about 84 px
  wide against 74). Figma's tablet flow uses about 11 px titles and 9 px
  notes; the library's smallest text styles are 12 and 11 px (gap:
  Workflow flow (tablet)).

- **Agent link chip.** The `eval-grader` chip has a grey border where
  Figma's is the agent purple, and it is about 3 px taller with a
  slightly larger label. It is a secondary `Button` (gap: Agent link
  chip).

## Library connectors

After the move to `FlowLine`, `pnpm fidelity` on every built frame of inbox, workspaces, artifacts
and toolkit (2026-11-18, library 1.0.0-beta.31) gives T18 the same results as
before: the same text, position and rule results.

- **Status bar and corners (not real).** Figma's 9:41 status bar and the
  rounded device corners are design-only chrome (d-089); the app draws
  neither.
- **Background dots.** The faint dots behind the page are the app
  frame's backdrop, and they fall in other places than Figma's (one on
  the "s" of Evals). The app frame is outside this page.

## Library beta.36 parts

The elbows and the loop moved to `FlowElbow` and `FlowLoop end="up"`
(library #144, beta.36). `pnpm fidelity toolkit` on every Toolkit frame
before and after the change (2026-11-18) gives T18 the same text and rule
results (both pass) and the same 15 of 41 passing layers. The flow is
1 px shorter, as the loop label's wrapper is now as high as the badge
(20 against 21): `flow · by phase` and `kind section · workflow` h +77.6
(were +78.6), `runs` and `link · eval-grader` y +78.6, `columns`,
`file preview`, `preview bar` and `rendered markdown` y +81.6, `side` and
`files` y +98.6, `file · skill-eval-round.md` y +101.6, and
`toolkit item` h -57; `label · new failure` keeps x -8.8, y +77.3,
w +17.7.
