# M07 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D05 T05 M07`, then `pnpm fidelity toolkit`,
2026-11-18, against the installed library 1.0.0-beta.42), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/skillDiscussPhone.ts`: D3's
data with writer's discussion open, full screen with no tab bar. The
frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and no
  render text is extra.
- Position: 13 of 16 layers pass: `nav`, `task · discussing`, `pill · Skill`,
  `chevron · open task`, `model and context`, `guard`, `empty state`,
  `it can`, `suggestions`, the three suggestion buttons and
  `composer · discussion`. Three fail.
- Rules: pass.

## Deviations

- **Nav buttons.** Workbench is `Button size="xs" textSize="xs"`, 102 ×
  24 against Figma's 93 × 22, so it and the Discussion pill before it
  start further left (`button · Open in Workbench` x -8.8 w +8.8,
  `pill · Discussion` x -9.7; gap: Discussion nav button). The button is
  disabled with a title: no Workbench state takes a toolkit chat.
- **Card height.** The card is 140 high against Figma's 138: the
  `ModelChip` is 26 high against 22 and the guard's three lines are 16
  high against 15, so its rows sit 2 apart against Figma's 5 (gap:
  Discussion model chip). The area under it starts 8 under the card, as
  in Figma.
- **Discussion area.** Figma's `discussion` (464:184) holds the empty
  state and the reply box; in `DetailFrame` the reply box is the sticky
  footer, so the area ends above it (`discussion` h -107). This is the
  d-107 structure that keeps the reply box in view.
- **Empty state.** As on T05: the tile and title are taller than Figma's,
  the "It can" icons are 12 px, and the links icon is a chain (gaps:
  Discussion empty state, Links icon).
- **Reply box.** Figma draws the reply box focused, with a violet
  #6863b0 border and a #9e8fff caret. The story focuses it, and
  `Composer` draws its cyan focus border (#3a819d) and its caret in
  `accent.default` (gap: Composer focus). The box is 78
  high against 75, so its placeholder sits 1.5 px lower and its buttons
  3 px lower (gap: Composer size). The attach button is a 28 px rounded
  square with a hairline #24314f border on the #17213a fill, as Figma's
  (464:219), and `Composer` takes no variant for it, as on the other
  pages; its clip is 16 px against Figma's 14 (gap: Composer size).
  Attach does nothing.
- **App frame.** The page hides the tab bar as the Artifacts and Inbox
  discussions do (AppShell with no `tabBar`); AppShell, the rail and the
  tab bar are unchanged.
