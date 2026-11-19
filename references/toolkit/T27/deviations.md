# T27 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T27`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookEvalsTablet.ts`: D28's data; the hook
keeps T19's header. Every other Toolkit frame (T03, T04, T06 to T08,
T10, T15, T17 to T19 and T28 to T38 and the list frames) gives the same
text, position and rule results as before the Evals tab. The frame's
`exceptions.json` excepts the string below, with the entry that records
it; with it the text and rules checks now pass. A later run (after the
review's fixes and the icons in the test line) gives the same results,
but for the text check, which the icons fail.

## Checks

- Text: fail. 1 string is missing: `A hook has no eval cases. Its test script runs fixed messages and the rule’s ✗ and ✓ examples through the hook, so the rule and the hook cannot drift apart.`
  (492:3729): the render draws its ✗ and ✓ as the library's cross and
  check icons, so its text has no glyphs (see Cross mark). Every other
  Figma string is in the render and visible, and nothing extra shows.
- Position: 24 of 27 layers pass. The 3 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -528;
  `492:3522` x +2 y -1 w +11.7 h +2. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -528: the Container pads 24 at the
  sides against 22). This is the d-107 structure that keeps Back in
  view, as on T17 and T28 (gap: Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`492:3522` x +2
  y -1 w +11.7 h +2), as on T17, T37 and T38: the heading text style
  draws the name a little wider.
- **Test badge.** The badge 43 of 43 pass is the library's
  `Badge size="sm" tone="done"` with `CheckIcon` at 12 px, against
  Figma's 11 px icon. Its stroke is 1 px, where Figma's check is about
  2 px wide, so the render's check is thinner; no icon takes a weight
  (gap: Evals criterion badge).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and Activity
  ends at 462.3 against Figma's 463; the tabs start at 24 against 22,
  the Container's 24 px side. The selected tab's outline is
  `border.selected` at half alpha where Figma's is solid cyan (d-050).
- **Cross mark.** Figma's test line has the ballot cross ✗ (U+2717)
  and the check ✓ (U+2713), the cross slanted. The line now draws them
  as the library's `CloseIcon` and `CheckIcon` (12, the text's size, in
  `fg.muted`, named fail and pass for assistive technology), so the
  marks are upright line icons, and the render's line has no glyphs:
  the text check no longer finds Figma's string with ✗ and ✓ in it
  (a coordinator decision; gap: Symbol glyphs, whose font gap remains
  only for other text).
- **Line break.** The test line breaks after "so the", where Figma's
  breaks after "rule": the text box is 674 px wide against Figma's 678
  (the Container's 24 px sides, d-107), and with "rule" the first line
  is 676 px. The two lines take the same height.
