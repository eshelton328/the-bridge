# T17 deviations

What still differs from Figma T17 · Discussion, before the first message (`discussionPage`, D14's discussion as a page), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (1 string excepted in `exceptions.json`).
- Position: 0 of 10 layers pass.
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav`: x +2, y -21, w -4, h -2; 29 px removed: y +8.
- `model and context`: x -4.7, y -24, w +9.6, h +4; 29 px removed: y +5.
- `task · discussing`: x +2, y -23, w -4, h +8; 29 px removed: y +6.
- `chevron · open task`: x -6, y -20, w +0, h +0; 29 px removed: y +9.
- `guard`: x +6, y -19, w -12, h +2; 29 px removed: y +10.
- `discussion`: x +2, y +1, w -4, h -74; 29 px removed: y +30.
- `empty state`: x +2, y -13, w -4, h +105; 29 px removed: y +16.
- `it can`: x -74, y -76, w +148, h +2; 29 px removed: y -47.
- `suggestions`: x -94.5, y -76, w +189, h +0; 29 px removed: y -47.
- `composer · discussion`: x +2, y +20, w -4, h +3; anchored to the bottom, no status bar offset.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets above give the rest as "29 px removed". Measuring below the
  status bar is an open request to Erik. Library gap: Top and bottom
  safe areas on the tablet.
- **Task card under the nav.** The card sits 8 under the nav, as
  Figma draws it (was 16), so with the status bar removed it is within
  6 px of Figma (`task · discussing` y). Every layer under it moved up
  8 too, which makes its raw y offset 8 px larger: the fix exposes the
  status bar offset that was there before; it adds no difference.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Discussion page header.** Back ("Task") is the library's
  `BackRow`, 28 px high against Figma's 30 row 4 px under the status
  bar; `Container size="tablet"` pads 12 at the top, so `nav` sits 8 px
  lower than Figma's once the status bar is removed. The model and
  context are `ModelChip`, `ContextMeter` and "context" in `monoSm`, as
  in D14; the chip's own padding makes the group 10 px wider and 4 px
  taller (`model and context`). The Discussion pill is `StatusPill
  tone="running"`. Library gap: Chat header on the tablet.
- **Task card.** A `Panel` with the title (`paneTitle`, SemiBold 15),
  the Next step pill, a chevron, the task's place and the guard. The
  `Panel` pads 16 against Figma's 12, so the card is 8 px taller
  (`task · discussing` h +8), the chevron 6 px left (`chevron · open
  task` x -6) and the guard 6 px right (`guard` x +6, w -12). Library
  gap: Chat header on the tablet.
- **Discussion column.** Figma sets the entries in a 560 px column at
  the start of the page; no size token is 560, so the messages and
  proposals take the page's 708 px (`w +148` on each). The first entry
  sits 24 below the card (Figma 22, d-072). Library gap: Discussion
  column on the tablet.
- **Reply box.** Figma leaves a 21 px home-indicator area under the
  reply box; `AppShell` keeps it only on the phone, so the reply box
  sits 20 px lower (`composer · discussion` y +20, anchored to the
  bottom, no status bar offset) and the `discussion` area is shorter.
  The story focuses the composer, as Figma draws it with a caret; the
  focused border is cyan, not Figma's lighter grey. Library gaps: Top and
  bottom safe areas on the tablet, Composer focus.
- **Context meter value.** `exceptions.json` excepts the meter's
  percentage: `ContextMeter` draws the number and the % sign as two text
  nodes, so the text check cannot match the whole string; the meter
  shows it, as in D14.
- **Empty state.** `DiscussionEmpty` as in D14, at the top of the
  column. Figma puts its icon tile 60 px under the column's top and the
  "It can" panel and the suggestions in the 560 px column (402:11248,
  402:11262); no spacing token is 60 and no size token 560, so the
  empty state starts at the column's top (`empty state` y), and the
  panel and suggestions take the page's width (`it can`, `suggestions`
  x, w). The empty state holds the panel and the suggestions, so it is
  taller than Figma's (`empty state` h). Library gaps: Discussion column
  on the tablet, Empty state with an icon tile.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reply box not focused (P1): checked, it is. The play test focuses the reply box and asserts `toHaveFocus`, and the capture shows the focused border: the reply box's top edge is #3a819d (`border.selected` over the fill) against #24314f unfocused. Figma's focused border is #6863b0, so the render's focus reads as a faint cyan line. Library gap: Composer focus.
- Reply placeholder lighter (P2/P3): recorded with the focus; Playwright hides the caret, and the placeholder is `Composer`'s own colour. Library gap: Composer focus.
- Model chip chevron thin and grey (P3): recorded. `ModelChip` draws its chevron in `fg.muted` and has no prop for Figma's heavier #e6ecff one. Library gap: Styles that differ from Figma.
- Empty state to "It can" gap about 4 px smaller (limit): within the tolerance; the column layout is recorded above (Discussion column on the tablet).
