# D28 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D28`, 2026-11-18, against library 1.0.0-beta.36:
a first run and three fix rounds), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookEvals.ts`: D9's data (D4's list with
only the Rules, Workflows and Hooks groups), with the hook commit-msg
open on its Evals tab. Every other Toolkit frame (D03, D04, D06 to D10,
D13, D14, D19 and D29 to D39 and the list frames) gives the same text,
position and rule results as before the Evals tab. The frame's
`exceptions.json` excepts the strings and the `hiddenOverflow` findings
below (the test line's needs none since the text check change of
2026-11-19, see Cross mark), each with the entry that records it; with them the text and rules
checks now pass.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below. The test line (492:2185) passes with no
  exception: the check sees the ✗ and ✓ of the library's `Glyph` by its
  icons (see Cross mark).
- Position: 43 of 44 layers pass. The 1 that fail: `group · WORKFLOWS` y
  -5. Each is explained below.
- Rules: pass. 1 finding is excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`.

## Deviations

- **Row height.** Each list row is 52 px high against Figma's 53, and
  the open item's row 52 against its 55 (`ListRow padding="pane"`,
  library 1.0.0-beta.65); 53 and 55 are off the 4 px grid (d-100), so 52
  is the decision. The kind tile, the name over the path and the counts
  sit centred down the row, as in Figma; the tile is 11 px in against
  Figma's 10, since 10 needs a 9 px padding that no space token has
  (gap: Toolkit row (pane)). Each row starts higher than Figma's by 1 px
  for each row above it and 3 px after the open item's row, and the
  group headers are 3 px taller than Figma's 27. The keys past the
  tolerance: `group · WORKFLOWS` y -5. With the shorter rows the last
  rows' text (`hooks/commit-msg`, `→1 ←1`, `commit-msg`) lies above the
  frame's foot and is visible, so its exceptions are gone. The list no
  longer runs past the frame's foot, so the pane does not scroll on its
  own and its `hiddenOverflow` exception on `[data-figma="toolkit
  list"]` is gone.
- **List pane.** The kind chips are wider than the list pane and scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`);
  Figma cuts the Workflows chip at the same edge, so `Workflows` and `2`
  are not visible in either. `FilterChips fade="none"` (library
  1.0.0-beta.65) draws the cut chip at full strength up to the pane's
  edge, as Figma does; before, it faded out over 24 px. Not visible past
  the frame's foot: `A hook has no eval cases. Its test script runs
  fixed messages and the rule’s ✗ and ✓ examples through the hook, so
  the rule and the hook cannot drift apart.`.
- **Test badge.** The badge 43 of 43 pass is the library's
  `Badge size="sm" tone="done"` with `CheckIcon` at 12 px, against
  Figma's 11 px icon. Its stroke is 1 px, where Figma's check is about
  2 px wide, so the render's check is thinner; no icon takes a weight
  (gap: Evals criterion badge).
- **Item tabs.** Since library #153 (beta.42) only the selected tab has
  a border, so each tab is within 1.1 px of Figma's width and starts
  within 2 px of its x: Overview starts at 526 against Figma's 524 (the
  list pads 2 px in the default density), and Activity ends at 988.3
  against 989. The selected tab, Evals, is 60.9 × 32 against Figma's
  61 × 34, 2 px lower (y 180 against 178), since `ItemTabs`' selected
  tab is as high as the others (32) and no size token is 34 (gap: Item
  tab width).
- **Cross mark.** Figma's test line has the ballot cross ✗ (U+2717)
  and the check ✓ (U+2713), the cross slanted. Since library
  1.0.0-beta.67 (2026-11-19) the line draws them with the library's
  `Glyph` (`symbol="cross"` and `"check"`, 12, the text's size, in its
  colour): the line's text is Figma's string, ✗ and ✓ included, and the
  glyph draws Figma's slanted cross and thin check in their place. The
  glyph keeps each character at font size 0 and transparent; since the
  text check change of 2026-11-19 the check measures a Glyph's character
  by its icon (shown, at least 1 px, in view and not covered), so it sees
  the line whole and the frame needs no exception for it.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (492:1827) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 492:1827 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (492:1832)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 492:1832, as for `icon/artifacts`.
