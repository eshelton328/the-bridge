# M30 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M30`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookEvalsPhone.ts`: T27's data; the hook
keeps M22's header. Every other Toolkit frame (M01, M02, M04 to M06,
M08, M09, M11, M12, M17, M19 to M22 and M31 to M41 and the list frames)
gives the same text, position and rule results as before the Evals tab.
The frame has no `exceptions.json`. A later run (after the review's
fixes and the icons in the test line) gives the same results, but for
the text check, which the icons fail.

## Checks

- Text: fail. 1 string is missing: `A hook has no eval cases. Its test script runs fixed messages and the rule’s ✗ and ✓ examples through the hook, so the rule and the hook cannot drift apart.`
  (492:4990): the render draws its ✗ and ✓ as the library's cross and
  check icons, so its text has no glyphs (see Cross mark). Every other
  Figma string is in the render and visible, and nothing extra shows.
- Position: 22 of 25 layers pass. The 3 that fail: `button · Discuss` x
  +8 w -8; `toolkit` y +36 h -193; `evals` y -1 h -6. Each is explained
  below.
- Rules: fail. 1 `hiddenOverflow` finding:
  `[data-figma="toolkit"] > div.item-tabs__root:nth-of-type(3) > div.item-tabs__list:nth-of-type(1)`.
  Each is explained below; this frame takes no exceptions.

## Deviations

- **Discuss button.** As on M19: an icon-only `Button` is square, so
  Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and starts further
  right (`button · Discuss` x +8 w -8; gap: Item action buttons).
- **Item frame.** Figma's `toolkit` holds the back row and the item,
  from y 42 down to the tab bar at y 767. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and runs to the tab's source line
  (`toolkit` y +36 h -193), as on M19 (d-107).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and within
  1.7 px of its x: Evals is 319.5 to 376.4 against Figma's 321 to 378,
  inside the list's end (378), so its outline is whole, and the list
  stays unscrolled, as Figma's. Activity runs past the screen, as in
  Figma; the list's sideways scroll is the `hiddenOverflow` finding
  `[data-figma="toolkit"] > div.item-tabs__root:nth-of-type(3) > div.item-tabs__list:nth-of-type(1)`.
  The outline stays `border.selected` at half alpha (d-050).
- **Line heights.** The tab's headers, its small and mono lines and its
  rows are 16 px high in the `monoCaps`, `small` and `mono` text styles
  against Figma's 17: the library keeps line heights on the 4 px grid
  (d-072). The rows sit 8 and 10 apart in turn to keep Figma's 25 and 47
  px steps on average, and the lines under the badges, the chart and the
  cases 2 px lower, so most rows stay within the tolerance; what remains
  adds up down the tab: `evals` y -1 h -6 (gap: Evals panels).
- **Test badge.** The badge 43 of 43 pass is the library's
  `Badge size="sm" tone="done"` with `CheckIcon` at 12 px, against
  Figma's 11 px icon. Its stroke is 1 px, where Figma's check is about
  2 px wide, so the render's check is thinner; no icon takes a weight
  (gap: Evals criterion badge).
- **Cross mark.** Figma's test line has the ballot cross ✗ (U+2717)
  and the check ✓ (U+2713), the cross slanted. The line now draws them
  as the library's `CloseIcon` and `CheckIcon` (12, the text's size, in
  `fg.muted`, named fail and pass for assistive technology), so the
  marks are upright line icons, and the render's line has no glyphs:
  the text check no longer finds Figma's string with ✗ and ✓ in it
  (a coordinator decision; gap: Symbol glyphs, whose font gap remains
  only for other text).
- **Line breaks.** The test line keeps "messages" on its first line,
  where Figma moves it to the second. The text box is 332 px wide in
  both, and the render's first line with "messages" is 330 px; on the
  desktop (D28) the same text ends within 1 px of Figma's, so the
  glyphs are as wide. Figma breaks earlier, so the three lines break at
  other words but take the same height.
