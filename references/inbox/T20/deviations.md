# T20 deviations

What still differs from Figma T20 · Proposed new tasks (`tasksProposedPage`, D17 on the discussion page), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.8, which adds #109; updated on 2026-11-17 with library 1.0.0-beta.9, #110 and #111), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (1 string excepted in `exceptions.json`).
- Position: 0 of 10 layers pass.
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `nav`: x +2, y +8, w -4, h -2.
- `model and context`: y +5, w +6.4, h +4 (x passes with library beta.15).
- `task · discussing`: x +2, y +6, w -4, h +8.
- `chevron · open task`: x -6, y +9, w +0, h +0.
- `guard`: x +6, y +10, w -12, h +2.
- `discussion`: x +2, y +30, w -4, h -103.
- `message · you`: x +2, y +16, w +148, h +1.
- `message · discussion`: x +2, y +17, w +148, h +1.
- `proposal · CREATE 3 TASKS`: x +2, y +18, w +148, h +2.
- `composer · discussion`: x +2, y +20, w -4, h +3.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Task card under the nav.** The card sits 8 under the nav, as
  Figma draws it (was 16). The card is still 6 px lower than Figma's
  (`task · discussing` y +6), because the header above it sits lower
  (`nav` y +8). Every layer under the card moved up 8 with it.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Discussion page header.** Back ("Task") is the library's
  `BackRow`, 28 px high against Figma's 30 row 4 px under the status
  bar; `Container size="tablet"` pads 12 at the top, so `nav` sits 8 px
  lower than Figma's (`nav` y +8). The model and
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
  sits 20 px lower (`composer · discussion` y +20) and the
  `discussion` area is shorter.
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
  draws. The reply's author name, "Discussion", is `labelXsStrong`
  (SemiBold 12/16), Figma's (was `label`, Medium 14/20). Library gap:
  Message author icon and small text.
- **Proposal block.** `ProposalBlock` as in D15 to D19; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **New tasks.** As in D17: each task is a bordered box with a `Checkbox
  tone="discuss" size="compact"`, whose checked box is violet
  (`accent.discuss`, #9e8fff), Figma's. Its title is `bodySm` (13/20)
  and its meta line the `Checkbox`'s `description` in `monoSm`, aligned
  with the title (library #109, beta.8), and each box is 52 px high, as
  Figma's 402:11865. "Also remove this task" is `Checkbox size="sm"
  tone="discuss" labelTone="muted" inline`: a 16 px row, as Figma's
  402:11889, with the label in `small` (12/16) in `fg.muted` (#8a97b8,
  Figma's grey) and a 24 px press area (library beta.9; was a 32 px row
  in `fg.default`). The block's height is now within the tolerance
  (`proposal · CREATE 3 TASKS` h +2; was h +18 with the 32 px row, h +60
  with 66 px boxes). The boxes and Also remove this task work: the count
  on Create follows them, Create adds the checked tasks to the list with
  a toast, and Also remove takes this task out too
  (`InboxRoute.test.tsx`).
- **Button labels.** Create 3 tasks and Discard are `ProposalBlock`'s
  own `size="sm"` buttons in `labelXs` (Medium 12/16), as Figma sets
  them (402:11894; library beta.9).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108), with this branch's app changes, move these layers: `message · discussion` x +2, y +17, w +148,
  h +1 (was x +2, y +17, w +148, h +5); `proposal · CREATE 3 TASKS` x
  +2, y +18, w +148, h +60 (was x +2, y +22, w +148, h +60). The cause
  is the discussion reply's author name in `labelXsStrong` (SemiBold
  12/16, Figma's; was `label`, Medium 14/20), a 4 px shorter line.
- **Beta.8 (2026-11-17).** Library 1.0.0-beta.8 (#109) moves this
  layer: `proposal · CREATE 3 TASKS` x +2, y +18, w +148, h +18 (was x
  +2, y +18, w +148, h +60). The cause is the new-task boxes at Figma's
  52 px (`Checkbox size="compact"` with `description`; was 66).
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) draws
  `ProposalBlock`'s own buttons (Create 3 tasks, Discard) in `labelXs`
  (Medium 12/16), as Figma's (was `label`, Medium 14/20), and puts "Also
  remove this task" on a 16 px `inline` row in `fg.muted` (was 32 px,
  `fg.default`). This moves one layer: `proposal · CREATE 3 TASKS` x +2,
  y +18, w +148, h +2 (was x +2, y +18, w +148, h +18).
- **Model and context label (2026-11-18).** "context" is `smallXs`
  (Geist Regular 11), 38 px wide as Figma's, not `monoSm` (46 px). The
  group is now within 1.8 px of Figma's width; `model and context` y +5 px stays.
- **Discussion layer (2026-11-18).** Figma's `discussion` layer
  holds the entries and the reply box (T17 ends 10 px under the box). The
  render tags only the entries, because `ScrollFrame` puts the entries
  in its body and the reply box in its footer, and no element holds both
  without the task card above them. So `discussion` y +28, h -101 px.
  The page structure stays (d-107).
- **Task card padding (2026-11-18).** The task card is now the
  `notice` `Panel` (10 px at the top and bottom, 12 at the sides), as
  Figma's card, not the `section` one (12 and 16): `task · discussing` y +6 px (was y +6, h +6 px); `guard` y +6 px (was x +6, y +8, w -12 px); `chevron · open task` y +6 px (was x -6, y +8 px). The
  entries under the card start 4 px higher.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reply box not focused (P1): checked, it is. The play test focuses the reply box and asserts `toHaveFocus`, and the capture shows the focused border: the reply box's top edge is #3a819d (`border.selected` over the fill) against #24314f unfocused. Figma's focused border is #6863b0, so the render's focus reads as a faint cyan line. Library gap: Composer focus.
- New-task rows taller than Figma's (P2): recorded. Figma's box is 52 high (402:11865: 9 padding, the title 17, the meta 14); `Checkbox` keeps a `control.md` (32) row for the touch target, so each box is 66. Library gap: Message author icon and small text. (Fixed by beta.8, #109: `Checkbox size="compact"` with `description`, 52 px, Figma's.)
- "Discussion" author label larger and lighter (P2): recorded. Figma sets it in SemiBold 12/16; no text style is 12 px SemiBold, so it stays `label` (Medium 14). Library gap: Message author icon and small text. (Fixed by beta.7: the name is `labelXsStrong`, SemiBold 12/16, Figma's.)
- "Also remove this task" near-white against Figma's grey (P2): fixed. It is `Checkbox size="sm"`, Figma's 12/16, and since beta.9 `labelTone="muted"` draws the label in `fg.muted` (#8a97b8), Figma's grey (402:11889), on a 16 px `inline` row.
- Model chip chevron thin and grey (P3): recorded. `ModelChip` draws its chevron in `fg.muted` and has no prop for Figma's heavier #e6ecff one. Library gap: Styles that differ from Figma.
