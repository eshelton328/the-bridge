# M01 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitListTablet.ts`, T1's: M1 shows the
same items and counts (writing-reviewer at →3 ←4), in one column of rows.
D01 and T01 give the same results as before M01. The numbers below are
from the run with library 1.0.0-beta.15 and the props that library #115
added: `Button pressedTone="accent"` and `FilterChips padding="none"`. A
rerun with library 1.0.0-beta.26 (the-bridge #60: the tab bar lies over
the page) gave the same counts (2026-11-17). The Checks and the numbers below
are from `pnpm fidelity toolkit` on 2026-11-18, against library
1.0.0-beta.47, with the props that library #166 added to the rows:
`ListRow padding="phone"`, `trailingAlign="center"` and
`leadingGap="12"`.

## Checks

- Text: fail. Every Figma string is in the render. Two strings are not
  visible: `AGENTS` and `7` (429:199), the Agents header, lie under the
  tab bar, which lies over the list (AppShell `tabBarOverlay`), and run
  past the screen's foot, because the taller rows push it down (see Row
  height). On main (beta.47 without these props) eight strings were not
  visible; the readme and writer rows now show above the bar, as in
  Figma.
- Position: 12 of 39 layers pass (`header`, `button · list`, `button · map`,
  `button · activity`, `filter · chips`, `search`, `tab bar`). The Rules group and its rows are in `exceptions.json`: the
  frame ends at the last Agents row, and the render draws Rules below it.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass. Two `hiddenOverflow` findings are in `exceptions.json`: the
  list scrolls under the pinned tab bar (`main.app-shell__detail`), and
  the kind chips scroll sideways, with Workflows cut at the right edge as
  in Figma (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Row height.** Each row is 58 px high against Figma's 53 (`h +5` on
  every row key). Library #166 gave `ListRow` the phone row's inset
  (4 at the sides, 8 above and below), but the row keeps its 1 px border
  and the title stays `label` (14/20), and 53 is off the 4 px grid
  (d-100; gap: Toolkit row (phone)). `toolkit row · agents-md` starts
  where Figma's does; each row after it starts 5 px lower again:
  `toolkit row · ambitious` y +6; `toolkit row · audit-slop` y +11;
  `toolkit row · eval-cases` y +16; `toolkit row · mermaid-diagrams`
  y +21; `toolkit row · pr-description` y +26;
  `toolkit row · project-setup` y +31; `toolkit row · readme` y +36;
  `group · AGENTS` y +46; `toolkit row · diagram-reviewer` y +53;
  `toolkit row · eval-case-writer` y +58; `toolkit row · eval-grader`
  y +63; `toolkit row · pr-description-checker` y +68;
  `toolkit row · readme-cold-reader` y +73;
  `toolkit row · writing-reviewer` y +83. The two writer rows have no
  key, because two shown items share the name. The screen shows the
  eight Skills rows above the tab bar; Figma shows them and the top of
  writer.
- **Row content.** With #166 the tile is 4 px in, as Figma's, the name
  starts 12 after it (`leadingGap="12"`), and the counts and chevron sit
  centred down the row (`trailingAlign="center"`), as in Figma. The name
  is `label` (14/20) against Figma's larger 23 px line. The counts are in
  the path's grey, as in Figma (gap: Toolkit row (phone)).
- **Chevron.** The row's chevron is 12 px, 6 after the counts, against
  Figma's 14 px, 12 after them (`icon/right`, 429:105). No icon token
  has 14, and with a 16 px chevron the longest path
  (`agents/pr-description-checker.md`) wraps to a second line (gap:
  Toolkit row (phone)).
- **Read-only line.** The line starts 5 px higher than Figma's
  (`read-only line` y -5: Figma y 185, render 180). The chip row lost
  its 4 px of padding (`FilterChips padding="none"`), and the phone
  search is still 36 px high against Figma's 40: no size or control
  token gives `SearchField` 40 (gap: Phone search height). Before #115 the two cancelled out. The SKILLS header under
  the line starts 6 px higher (`group · SKILLS` y -6).
- **Group headers.** SKILLS and AGENTS are 30 px high against Figma's 23
  (`group · SKILLS` h +7, `group · AGENTS` h +7;
  `GroupHeader variant="sidebar"`). Library #166 added header variants
  for the desktop and a tablet only: no label offset was given for the
  phone's, and 23 is off the 4 px grid (d-100; gap: Toolkit group
  header).
- **View buttons.** List, Map and Activity are icon-only secondary
  buttons; List is pressed with `pressedTone="accent"`, so its border
  and icon are cyan as in Figma. The icons are 16 px against 17: no icon
  token has 17, which is off the 4 px grid (d-100; gap: Phone view
  buttons).
- **Map button.** The Map button sets the view to the map, but the screen
  has no map yet: it keeps showing the list. The map is a later frame
  (the note's links view, M3); the Activity button is the same.
- **Toolkit box.** Figma's `toolkit` layer (429:50) is the list's content
  box, 366 wide from x 12, and it ends at the tab bar (h 725). The
  render's `toolkit` is the scrolling list with its 12 px sides, 390 wide
  from x 0, and as high as all its rows (`toolkit` x -12, w +24,
  h +1197).
- **Hooks chip.** The chip row ends with Hooks 1 after Workflows; it lies
  past the screen's right edge, as the chip row scrolls. Figma's row has
  no Hooks chip in the frame.
- **Tab bar.** The shared `AppTabBar` (`device="phone"`, More selected,
  d-105). Its box passes the position check.

## Second review

- **Chips.** The second review found the kind chips wider and further
  apart, with the Rules chip about 16 px further right and the Workflows
  chip fully off screen where Figma shows its left edge. That review was
  before the row lost its 2 px inset; the chip row now passes the
  position check, and the chip widths have not been reviewed again (gap:
  Kind chip row).
- **Search.** The search field is 36 px high against Figma's 40 (gap:
  Phone search height; see Read-only line).
