# T17 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T17`, 2026-11-17, against library 1.0.0-beta.18),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleOpenTablet.ts`: D4's data (`ruleOpen`),
with the rule skills open. On a tablet the rule replaces the list in the
shared `DetailFrame` (d-107), as T3's skill does: the back row stays at the
top and the item scrolls under it (`web/src/app/ToolkitStickyBack.test.tsx`).
D03, D04, D07, D08, D09, T03 and M02 give the same results as before
T17. The Checks below are from a rerun with library 1.0.0-beta.25 and
the item tabs' `tone` and `density` props (2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text, and no covered text.
- Position: 19 of 22 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `487:501`,
  `when it loads`, `columns`, `file preview`, `preview bar`,
  `rendered markdown`, `tab bar`). The 3 that fail are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (487:332) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item`
  y +32, h -389). This is the d-107 structure that keeps Back in view, as
  on T03.
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of `Container size="tablet"` (Figma 22)
  it starts 5 px further left (`button · Discuss` x -5.1). Gaps: Item
  action buttons, Tablet item spacing.
- **Title width.** The title skills is 70.4 px wide and 40 high against
  Figma's 66 and 38 (`487:355` w +4.4): the `heading` glyphs and line
  height. It starts in place.
- **Load box.** The box is 46 px high against Figma's 42: `Panel
  tone="needsYou"` pads 12 above and below where Figma has 10 (gap: Rule
  load box). It spans the item as in Figma. Figma's rows around it are
  14 apart and no space token has 14, so on a tablet a rule's overview
  puts them 12 apart, which keeps the box and the file within 2 px of
  Figma's (gap: Tablet item spacing).
- **Rendered file width.** Figma keeps the rendered file's text 516 px
  wide inside the 712 px preview, so the paragraph on the bar breaks after
  "nobody". `MarkdownView` fills its box, so the paragraph's first line
  runs to "what is not" (gap: Rendered file text width). The preview's
  height stays within 4 px.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and since library #153 (beta.42) each tab is
  within 1.1 px of Figma's width: the tabs start at 24 against 22 (the
  Container's 24 px side), and Activity ends at 462.3 against 463. The
  item adds 4 above the panel, so the description stays in place. As on
  D4, the How it works, Files, Links, Evals and Activity panels are
  later frames.
- **Copy button and preview bar.** As on D4 and T03: the copy icon is a
  plain button with `CopyIcon` (gap: Path badge copy button), and the
  preview box and bar are drawn by the library's `FileFrame` (gap: File
  preview).
- **Side.** Figma has an empty `side` layer (487:526, 712 × 1) under the
  file; a rule has no side column (D4), so the render draws nothing there.

## Second review

- **Load box colour.** The reviewer saw a duller amber border on a
  brownish fill. Figma's box has the needs-you border and tint too; the
  tone differs with `Panel tone="needsYou"` (gap: Rule load box).
