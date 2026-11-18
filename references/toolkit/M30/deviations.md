# M30 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M30`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookEvalsPhone.ts`: T27's data; the hook
keeps M22's header. Every other Toolkit frame (M01, M02, M04 to M06,
M08, M09, M11, M12, M17, M19 to M22 and M31 to M41 and the list frames)
gives the same text, position and rule results as before the Evals tab.
The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and
  nothing extra shows.
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
- **Item tabs.** Each unselected tab is 1.3 to 1.8 px wider than
  Figma's: `ItemTabs` gives every tab a 1 px transparent border, where
  Figma draws a border only on the selected tab. So Evals is 327.5 to
  384.3 against Figma's 321 to 378, and the list, which ends at 378,
  cuts 6 px of its outline at the right. The list does not scroll the
  selected tab into view (gap: Item tab width). Activity runs past the
  screen, as in Figma; the list's sideways scroll is the
  `hiddenOverflow` finding
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
- **Cross mark.** The test line has Figma's ballot cross ✗ (U+2717)
  and check ✓ (U+2713), and passes the text check. Geist Variable's
  latin subset has neither mark, so the browser draws them in the
  system fallback font, where ✗ is an upright cross like the sign ×;
  Figma draws it slanted (gap: Symbol glyphs).
- **Line breaks.** The test line keeps "messages" on its first line,
  where Figma moves it to the second. The text box is 332 px wide in
  both, and the render's first line with "messages" is 330 px; on the
  desktop (D28) the same text ends within 1 px of Figma's, so the
  glyphs are as wide. Figma breaks earlier, so the three lines break at
  other words but take the same height.
