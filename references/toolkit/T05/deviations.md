# T05 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D05 T05 M07`, then `pnpm fidelity toolkit`,
2026-11-18, against the installed library 1.0.0-beta.42), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/skillDiscussTablet.ts`: D3's
data with writer's discussion open, on its tablet page with no tab bar.
The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible, and no
  render text is extra.
- Position: 12 of 16 layers pass: `nav`, `task · discussing`,
  `pill · Skill`, `chevron · open task`, `guard`, `empty state`,
  `it can`, `suggestions`, the three suggestion buttons and
  `composer · discussion`. Four fail.
- Rules: pass.

## Deviations

- **Nav buttons.** Open in Workbench is `Button size="xs" textSize="xs"`,
  148 × 24 against Figma's 135 × 22 (Medium 12 and a 12 px icon against
  Figma's 11 px label and icon), so it and the Discussion pill before it
  start further left (`button · Open in Workbench` x -14.9 w +12.9,
  `pill · Discussion` x -15.8; gap: Discussion nav button). The button is
  disabled with a title: no Workbench state takes a toolkit chat.
- **Model and context.** The `ModelChip` is 26 high against 22, and the
  wider button moves the row's middle 5 px left (`model and context`
  x -5 h +4; gap: Discussion model chip).
- **Discussion area.** Figma's `discussion` (464:349) holds the empty
  state and the reply box; in `DetailFrame` the reply box is the sticky
  footer, so the area ends above it (`discussion` h -117). This is the
  d-107 structure that keeps the reply box in view while the messages
  scroll.
- **Empty state.** The tile is `control.xl` (44) against 42 and the title
  28 high against 22, and the "It can" icons are 12 px against 14; the
  links icon is `LinkIcon`, a chain, where Figma draws a node graph (gaps:
  Discussion empty state, Links icon). The text, "It can" and the
  suggestions keep Figma's places.
- **Reply box.** Figma draws the reply box focused, with a violet
  #6863b0 border and a #9e8fff caret after the placeholder. The story
  focuses it, and `Composer` draws its cyan focus border (#3a819d) and
  its caret in `accent.default` (gap: Composer focus). The box ends 40
  over the screen's end, as Figma's: under beta.42's 34 px home
  indicator area the footer pads 6. The box is 78 high against Figma's 75: its placeholder line is
  20 high against 17, so the placeholder sits 1.5 px lower and the attach
  and Send buttons 3 px lower, and the attach button's clip is 16 px
  against 14 (gap: Composer size). Attach does nothing: no file flow is
  designed.
- **Card.** The item's card keeps Figma's 96 px: the pill and the mono
  lines are 2 px taller than Figma's, so its rows sit 2 apart against 5.
