# T02 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity artifacts T02`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. T2 is D2's open artifact on
the iPad mini, on its own page under a Back bar; most differences are
D2's (`../D02/deviations.md`).

## Checks

- Text: passes. Nothing is missing, hidden or extra.
- Position: 13 of 18 layers pass (`top bar`, `button · Discuss`,
  `button · copy`, `button · trash`, `title block`, `status`,
  `pill · New`, `chip · Claude artifact`, `button · Open artifact`,
  `link`, `section · MADE IN`, `made in` and `tab bar`). Five fail;
  see below.
- Rules: pass.

## Deviations

- **Project chip.** `project · File in a project` x +4, w -16.8,
  `chips` x +2, w -12.8, `chip · updated 12m ago` x -12.8. The project
  chip is a read-only `MetaChip` with no chevron (Figma 405:444) and no
  menu, so it is narrower and the updated chip sits further left. Library
  gap "Project chip menu".
- **Preview.** `preview` x +2, y +3, w -6, h -3.7. The page keeps 24 px
  sides (d-100, as T1) against Figma's 22, and Figma's preview frame is
  714 wide, one px past the page on each side, so the framed
  `Thumbnail shape="wide"` is 708 × 398 against 714 × 402. The chart's
  bars are the library's `Thumbnail kind="chart"` drawing: a brighter
  cyan and violet, and other heights and order than Figma's
  (405:457 to 405:465). The window bar's dots are about 10 px and 18
  apart against Figma's 5 and 9 (405:453 to 405:455), and the axis is
  narrower than Figma's 598 (405:466). Library gaps "Thumbnail colour"
  and "Artifact preview frame".
- **Open in workspace.** `button · Open in workspace` x -7.5. The page is
  4 px narrower (24 px sides), and `MadeIn`'s box pads 16 at the sides
  (D2's value on the 4 px grid) against Figma's 13 here, so the button
  sits further left.
- **Artifact title.** "Skill eval pass rates" is 28 px type (`heading`,
  28/40) against Figma's about 30 px in a 41 px box (405:433). Library
  gap "Artifact title size".
- **Link icon.** The link mark before the address is 12 px against
  Figma's 13 (405:472), the icon size on the 4 px grid.
- **Tab bar.** The shared tab bar (`AppTabBar device="tablet"`, not
  changed here: another chat holds it) spreads its six tabs over the full
  width; Figma groups them, 76 wide each, in the middle (405:373 to
  405:403, x 150 to 606). The `tab bar` box itself matches.
- **Buttons with no screen yet.** Discuss opens the discussion (T4) in
  Figma's note; T4 is a later run, so on the tablet Discuss does nothing.
  Copy link, Remove, the project chip, Open artifact and Open in
  workspace have no action, as in D2. Back returns to the library (T1).

## Values picked (d-100)

- Page sides: 24 (Figma 22, on the 4 px grid, as T1).
- Back bar: 20 under the status bar (the tablet `Container`'s 12 and 8),
  as Figma; 36 high (`sizes.control.lg`), as Figma.
- Title block: 20 under the Back bar and the sections 20 apart (Figma 18
  each, a tie on the 4 px grid takes the larger token, d-072); the rows
  of the title block 10 apart, as Figma.
- Discuss: the 28 px `Button size="sm"` (Figma 87 × 30 with 11 px sides);
  it is the nearest in width, and the 32 px `md` was 8.8 px wider.
- Copy link and Remove: icon-only 36 px buttons (`size="lg"`), as Figma.
- Open artifact: the 44 px `Button size="xl"` the full width (Figma 46).
- Link icon: 12 (Figma 13).
