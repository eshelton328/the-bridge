# T03 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04 D02 T02 M11 D03 D04 D07 D08 D09 T03`,
2026-11-17, against library 1.0.0-beta.18), each with its reason. The
library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillOpenTablet.ts`: D3's data (`skillOpen`),
with writer open. On a tablet the item replaces the list in the shared
`DetailFrame` (d-107): the back row stays at the top and the item scrolls
under it (`web/src/app/ToolkitStickyBack.test.tsx`). The other twelve
frames give the same results as before T03. The Checks below are from a
rerun with library 1.0.0-beta.25 and the item tabs' `tone` and `density`
props (2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text, and no covered text.
- Position: 15 of 31 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `487:78`,
  `preview bar`, `tab bar`). The 16 that fail are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass.

## Deviations

- **Rendered file width.** Figma keeps the rendered file's text 516 px
  wide, as on the desktop, inside the 712 px preview, so the paragraph on
  the writing rules has three lines and step 2 two. `MarkdownView` fills
  its box, so the paragraph has two lines and step 2 one, and the preview
  is 37 px shorter (gap: Rendered file text width): `columns` h -37,
  `file preview` h -37, `rendered markdown` h -37.
- **Side under the file.** Everything under the preview starts 35 px
  higher with the shorter file: `side` y -35 (Figma draws the side
  1 px high, h +279), `used in workflows` y -35, `files` y -34 (and
  w -380.8: the files list is as wide as its longest line, where Figma's
  layer spans the column), `file · SKILL.md` y -31,
  `file · references/` y -32,
  `file · artifact.md  chat.md  doc.md` y -33 w -12.2,
  `file · examples.md  prd.md  ticket.md` y -34 w -11.8,
  `file · scripts/` y -35,
  `file · check  ste-dict  ste-stop-hook  test-check` y -36 w -10.8,
  `evals link` y -35. The file lines with several names are about 11 px
  narrower, as on D3 (gap: Item file summary).
- **Item frame.** Figma's `toolkit item` (428:542) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item`
  y +32, h -217). This is the d-107 structure that keeps Back in view.
- **Back row.** The back row is 32 px high against Figma's 36, because
  the `md` buttons are 32 high (gap: Item action buttons), and its
  content is 24 px in from the sides where Figma has 22
  (`Container size="tablet"`, gap: Tablet item spacing). Discuss is
  99.5 px wide against 97 and ends 2 px further in, so it starts 5 px
  further left (`button · Discuss` x -5.1). The buttons are 8 apart, as
  in Figma.
- **Row spacing.** Figma's rows from the meta row to the columns are
  14 px apart; no space token has 14. The item uses 20 above the meta row
  and 12 between the rows, which keeps each row within 3 px of Figma's
  (gap: Tablet item spacing).
- **Title width.** The title writer is 79.5 px wide and 40 high against
  Figma's 74 and 38 (`428:567` w +5.5): the `heading` glyphs and line
  height. It starts in place.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and since library #153 (beta.42) each tab is
  within 1.1 px of Figma's width: the tabs start at 24 against 22 (the
  Container's 24 px side), and Activity ends at 462.3 against 463. The
  item adds 4 above the panel, so the description stays in place. As on
  D3, the How it works, Files, Links, Evals and Activity panels are
  later frames.
- **Copy button and preview bar.** As on D3: the copy icon is a plain
  button with `CopyIcon` (gap: Path badge copy button), and the preview
  box and bar are drawn by the library's `FileFrame` (gap: File preview).

## Second review

- **Skill evals link.** The chart icon and the chevron sit level with the
  title, about 11 px above the box's centre, as on D3 (gap: Toolkit row
  (pane)).
- **File lines.** The six lines are about 22 px apart against 23, so the
  list is about 5 px shorter (gap: Item file summary).
