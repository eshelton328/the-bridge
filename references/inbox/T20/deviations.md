# T20 deviations

What still differs from Figma T20 · Proposed new tasks (`tasksProposedPage`, D17 on the discussion page), after the last
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
- `message · you`: x +2, y -13, w +148, h +1; 29 px removed: y +16.
- `message · discussion`: x +2, y -12, w +148, h +5; 29 px removed: y +17.
- `proposal · CREATE 3 TASKS`: x +2, y -7, w +148, h +60; 29 px removed: y +22.
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
- **Messages.** Erik's message is `Message from="user"` and the reply is
  composed in `DiscussionEntry`, as in D15; their text is `body`
  (14/20) against Figma's 13/19, and the reply has the bubble Figma
  draws. Library gap: Message author icon and small text.
- **Proposal block.** `ProposalBlock` as in D15 to D19; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **New tasks.** As in D17: each task is a bordered box with a
  `Checkbox`, whose label is `body` (Figma 13 px) and whose box is the
  library's cyan where Figma's is violet, so the block is taller
  (`proposal · CREATE 3 TASKS` h). The boxes and Also remove this task
  work: the count on Create follows them, Create adds the checked tasks
  to the list with a toast, and Also remove takes this task out too
  (`InboxRoute.test.tsx`). Library gap: Message author icon and small
  text.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reply box not focused (P1): checked, it is. The play test focuses the reply box and asserts `toHaveFocus`, and the capture shows the focused border: the reply box's top edge is #3a819d (`border.selected` over the fill) against #24314f unfocused. Figma's focused border is #6863b0, so the render's focus reads as a faint cyan line. Library gap: Composer focus.
- New-task rows taller than Figma's (P2): recorded. Figma's box is 52 high (402:11865: 9 padding, the title 17, the meta 14); `Checkbox` keeps a `control.md` (32) row for the touch target, so each box is 66. Library gap: Message author icon and small text.
- "Discussion" author label larger and lighter (P2): recorded. Figma sets it in SemiBold 12/16; no text style is 12 px SemiBold, so it stays `label` (Medium 14). Library gap: Message author icon and small text.
- "Also remove this task" near-white against Figma's grey (P2): fixed in part. It is `Checkbox size="sm"` now, Figma's 12/16; Figma's label is #8a97b8 and `Checkbox` draws every label in `fg.default`. Library gap: Message author icon and small text.
- Model chip chevron thin and grey (P3): recorded. `ModelChip` draws its chevron in `fg.muted` and has no prop for Figma's heavier #e6ecff one. Library gap: Styles that differ from Figma.
