# M07 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D05 T05 M07`, then `pnpm fidelity toolkit`,
2026-11-18, against the installed library 1.0.0-beta.39), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/skillDiscussPhone.ts`: D3's
data with writer's discussion open, full screen with no tab bar. The
frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and no
  render text is extra.
- Position: 12 of 16 layers pass: `nav`, `pill · Skill`,
  `chevron · open task`, `model and context`, `guard`, `empty state`,
  `it can`, `suggestions`, the three suggestion buttons and
  `composer · discussion`. Four fail.
- Rules: pass.

## Deviations

- **Nav buttons.** Workbench is `Button size="xs" textSize="xs"`, 102 ×
  24 against Figma's 93 × 22, so it and the Discussion pill before it
  start further left (`button · Open in Workbench` x -8.8 w +8.8,
  `pill · Discussion` x -9.7; gap: Discussion nav button). The button is
  disabled with a title: no Workbench state takes a toolkit chat.
- **Card height.** The card is 146 high against Figma's 138: the
  `ModelChip` is 26 high against 22 and the guard's three lines are 16
  high against 15 (`task · discussing` h +8; gap: Discussion model chip).
  The area under it starts 4 under the card, so the empty state, "It
  can" and the suggestions keep Figma's places within 2 px.
- **Discussion area.** Figma's `discussion` (464:184) holds the empty
  state and the reply box; in `DetailFrame` the reply box is the sticky
  footer, so the area ends above it (`discussion` h -109). This is the
  d-107 structure that keeps the reply box in view.
- **Empty state.** As on T05: the tile and title are taller than Figma's,
  the "It can" icons are 12 px, and the links icon is a chain (gaps:
  Discussion empty state, Links icon).
- **Reply box.** Figma draws the reply box focused, with a caret; the
  render opens with nothing focused. Attach does nothing.
- **App frame.** The page hides the tab bar as the Artifacts and Inbox
  discussions do (AppShell with no `tabBar`); AppShell, the rail and the
  tab bar are unchanged.
