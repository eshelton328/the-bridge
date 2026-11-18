# M01 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/toolkitListTablet.ts`, T1's: M1 shows the
same items and counts (writing-reviewer at →3 ←4), in one column of rows.
D01 and T01 give the same results as before M01. The numbers below are
from the run with library 1.0.0-beta.15 and the props that library #115
added: `Button pressedTone="accent"` and `FilterChips padding="none"`.

## Checks

- Text: fail. Every Figma string is in the render. Eight strings are not
  visible, because the taller rows push them under the tab bar (see Row
  height): `readme`, `skills/readme/` and `→2 ←2` (429:181), `writer`,
  `skills/writer/`, `→7 ←4`, `AGENTS` and `7` (429:199).
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

- **Row height.** Each row is 62 px high against Figma's 53 (`h +9` on
  every row key). `ListRow` pads 10 inside a 1 px border; Figma's row
  has no border and sets the 36 px tile 8.5 px from its top (gap: Toolkit
  row (phone)). The first row starts 1 px lower (within the tolerance):
  the SKILLS header starts 6 px higher (see Read-only line) and is 7 px
  higher (see Group headers). Each row after it starts 9 px lower again:
  `toolkit row · ambitious` y +10; `toolkit row · audit-slop` y +19;
  `toolkit row · eval-cases` y +28; `toolkit row · mermaid-diagrams`
  y +37; `toolkit row · pr-description` y +46;
  `toolkit row · project-setup` y +55; `toolkit row · readme` y +64;
  `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +89;
  `toolkit row · eval-case-writer` y +98; `toolkit row · eval-grader`
  y +107; `toolkit row · pr-description-checker` y +116;
  `toolkit row · readme-cold-reader` y +125;
  `toolkit row · writing-reviewer` y +143. The two writer rows have no
  key, because two shown items share the name. The screen shows seven
  Skills rows above the tab bar; Figma shows eight and the top of writer.
- **Row content.** The tile is 7 px further in than Figma's, the name is
  `label` (14/20) against Figma's larger 23 px line, and the counts and
  chevron sit at the top of the row, level with the name, where Figma
  centres them on the row. The counts are in the path's grey, as in
  Figma (gap: Toolkit row (phone)).
- **Chevron.** The row's chevron is 12 px, 6 after the counts, against
  Figma's 14 px, 12 after them (`icon/right`, 429:105). No icon token
  has 14, and with a 16 px chevron the longest path
  (`agents/pr-description-checker.md`) wraps to a second line (gap:
  Toolkit row (phone)).
- **Read-only line.** The line starts 5 px higher than Figma's
  (`read-only line` y -5: Figma y 185, render 180). The chip row lost
  its 4 px of padding (`FilterChips padding="none"`), and the phone
  search is still 36 px high against Figma's 40 (gap: Phone search
  height). Before #115 the two cancelled out. The SKILLS header under
  the line starts 6 px higher (`group · SKILLS` y -6).
- **Group headers.** SKILLS and AGENTS are 30 px high against Figma's 23
  (`group · SKILLS` h +7, `group · AGENTS` h +7;
  `GroupHeader variant="sidebar"`; gap: Toolkit group header).
- **View buttons.** List, Map and Activity are icon-only secondary
  buttons; List is pressed with `pressedTone="accent"`, so its border
  and icon are cyan as in Figma. The icons are 16 px against 17 (gap:
  Phone view buttons).
- **Map button.** The Map button sets the view to the map, but the screen
  has no map yet: it keeps showing the list. The map is a later frame
  (the note's links view, M3); the Activity button is the same.
- **Toolkit box.** Figma's `toolkit` layer (429:50) is the list's content
  box, 366 wide from x 12, and it ends at the tab bar (h 725). The
  render's `toolkit` is the scrolling list with its 12 px sides, 390 wide
  from x 0, and as high as all its rows (`toolkit` x -12, w +24,
  h +1293).
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
