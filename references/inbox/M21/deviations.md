# M21 deviations

What still differs from Figma M21 · Proposed new tasks (`tasksProposedPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.8, which adds #109; updated on 2026-11-17 with library 1.0.0-beta.9, #110 and #111), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (21 strings checked; 2 Figma strings under exceptions.json).
- Position: 2 of 10 layers pass (`nav`, `chevron · open task`).
- Rules: pass (1 finding under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · discussing`: x +0, y -1, w +0, h +12.
- `model and context`: x +4, y +3, w +6.4, h +4.
- `guard`: x +4, y +6, w -8, h +3.
- `discussion`: x +0, y +27, w +0, h -126.
- `message · you`: x +0, y +13, w +0, h +1.
- `message · discussion`: x +0, y +14, w +0, h +2.
- `proposal · CREATE 3 TASKS`: x +0, y +16, w +0, h +2.
- `composer · discussion`: x +0, y -6, w +0, h +3.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **Discussion page header.** As on the tablet (T17), but the phone
  puts the model and context in the task card, under the task's place,
  as Figma draws them (`model and context` 454:216), and the nav keeps
  only Back ("Task") and the Discussion pill. `BackRow` is 28 px high
  against Figma's 29 (`nav` h -1). The model chip's own padding makes
  the group about 10 px wider and 4 px taller (`model and context` w,
  h).
- **Task card under the nav.** The card sits 8 under the nav, as
  Figma draws it (was 16), so it is within 1 px of Figma
  (`task · discussing` y -1). Every layer under it moved up 8 too.
- **Task card.** A `Panel` with the title, cut on one line with an
  ellipsis as Figma cuts it (TruncatedText; the exception says why the
  cut title passes), the Next step pill, a chevron, the place, the model
  and context and the guard. It is the notice `Panel`, which pads 10 and 12 as Figma does. Its
  rows are 4 apart against Figma's 5 (no spacing token is 5), and the
  model chip is 4 px taller, so the card is 6 px taller
  (`task · discussing` h +6). Every entry under the card starts lower
  by what the card adds.
- **Reply box.** The reply box comes last, under the proposal, as Figma
  draws it; in the check it sits at the bottom of the screen, 6 px
  higher than Figma's and 3 px taller (`composer · discussion` y -6,
  h +3), as on M18 and M24: `AppShell` keeps the home-indicator area
  under it (Page fits says more). The story focuses the
  composer, as Figma draws it with a caret; the focused border is cyan,
  not Figma's lighter grey (Library gap: Composer focus). Send adds
  Erik's message to the discussion and empties the box
  (the Inbox route tests); nothing answers it in this mock-up. The box
  has no attach button, where Figma draws a clip at its start: no file
  flow is designed, and `Composer` cannot draw its attach button
  disabled (LIBRARY_GAPS.md, Waiting for a design). Figma's caret
  blinks, so a still picture may show it or not; no change.
- **Context meter value.** `exceptions.json` excepts the meter's
  percentage: `ContextMeter` draws the number and the % sign as two text
  nodes, so the text check cannot match the whole string; the meter
  shows it, as in T17.
- **Messages.** Erik's message and the reply as in T18 and D15: their
  text is `body` (14/20) against Figma's 13/19, so each is a few px
  taller (`message · you`, `message · discussion` h). Library gap:
  Message author icon and small text. The reply's author, "Discussion"
  (402:7270), is `labelXsStrong` (SemiBold 12/16), as Figma's.
- **Proposal block.** `ProposalBlock` as in T18 to T23; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **New tasks.** As in T20: each box is `Checkbox size="compact"` with
  the meta line as its `description` (library #109, beta.8): the title
  in `bodySm` (13/20), the meta in `monoSm` aligned with it, and the box
  52 px high, as Figma's 402:7278 box. "Also remove this task" is
  `Checkbox size="sm" tone="discuss" labelTone="muted" inline`: a 16 px
  row, as Figma's, with the label in `small` (12/16) in `fg.muted`
  (#8a97b8, Figma's grey) and a 24 px press area (library beta.9; was a
  32 px row in `fg.default`). The block's height is now within the
  tolerance (`proposal · CREATE 3 TASKS` h +2; was h +18 with the 32 px
  row, h +60 with 66 px boxes). The task card above it puts the block 16
  px lower (`proposal · CREATE 3 TASKS` y +16).
- **Page fits.** The checks render 806 px high, the screen below the
  status bar (d-102). With the 52 px new-task boxes (beta.8) the page
  fits that screen, so nothing scrolls and the rules check passes; with
  beta.7 it was 26 px taller (scrollHeight 798 against clientHeight
  772) and scrolled (`hiddenOverflow` on `main.app-shell__detail`).
  The discussion area holds only the entries and ends under the
  proposal, where Figma's `discussion` layer runs down to the reply box
  and holds it (`discussion` y +27, h -126; was h -100: the proposal is
  42 px shorter, and the area's free space below it moved to the
  reply box).
- **Checked boxes.** The checked new-task boxes are violet, as Figma
  fills them: `Checkbox tone="discuss"` (`accent.discuss`, #9e8fff, as
  402:7278). The box is
  16 px, as Figma's (402:7278 is 16 × 16), and the label 13 px
  (`size="compact"`, `bodySm`), as Figma's.
- **Button labels.** The proposal's Create 3 tasks and Discard are
  `ProposalBlock`'s own `size="sm"` buttons in `labelXs` (Medium 12/16),
  as Figma sets them (library beta.9). `Composer`'s send is larger than
  Figma's 26 × 26. Library gap: Button label size.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `discussion` x +0, y +27, w +0, h -100 (was
  x +0, y +27, w +0, h -96); `message · discussion` x +0, y +14, w +0,
  h +2 (was x +0, y +14, w +0, h +6); `proposal · CREATE 3 TASKS` x
  +0, y +16, w +0, h +60 (was x +0, y +20, w +0, h +60); `composer ·
  discussion` x +0, y +20, w +0, h +3 (was x +0, y +24, w +0, h +3).
  The cause is the discussion reply's author name in `labelXsStrong`
  (SemiBold 12/16, Figma's; was `label`, Medium 14/20), a 4 px shorter
  line. `discussion` moves further from Figma: a Figma-matching change
  exposes an offset that was already there: the discussion area hugs
  its entries, so the shorter author line takes 4 px off an area that
  was already 96 px shorter than Figma's (the reply box follows the
  proposal, see Page taller than the screen).
- **Beta.8 (2026-11-17).** Library 1.0.0-beta.8 (#109) moves these
  layers: `proposal · CREATE 3 TASKS` x +0, y +16, w +0, h +18 (was x
  +0, y +16, w +0, h +60); `discussion` x +0, y +27, w +0, h -126 (was
  x +0, y +27, w +0, h -100); `composer · discussion` x +0, y -6, w +0,
  h +3 (was x +0, y +20, w +0, h +3). The cause is the new-task boxes
  at Figma's 52 px (`Checkbox size="compact"` with `description`; was
  66): the page now fits the screen, so the rules check passes and the
  reply box sits at the bottom.
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) draws
  `ProposalBlock`'s own buttons (Create 3 tasks, Discard) in `labelXs`
  (Medium 12/16), as Figma's (was `label`, Medium 14/20), and puts "Also
  remove this task" on a 16 px `inline` row in `fg.muted` (was 32 px,
  `fg.default`). This moves one layer: `proposal · CREATE 3 TASKS` x +0,
  y +16, w +0, h +2 (was x +0, y +16, w +0, h +18). No other layer
  moved.
- **Model and context label (2026-11-18).** "context" is `smallXs`
  (Geist Regular 11), 38 px wide as Figma's, not `monoSm` (46 px). The
  group is now within tolerance (was `model and context` w +6.4).
- **Discussion layer (2026-11-18).** Figma's `discussion` layer
  holds the entries and the reply box (M18 ends 10 px under the box). The
  render tags only the entries, because `ScrollFrame` puts the entries
  in its body and the reply box in its footer, and no element holds both
  without the task card above them. So `discussion` y +25, h -124 px.
  The page structure stays (d-107).
- **Task card padding (2026-11-18).** The task card is now the
  `notice` `Panel` (10 px at the top and bottom, 12 at the sides), as
  Figma's card, not the `section` one (12 and 16): `task · discussing` h +6 px (was h +10 px); `guard` within tolerance (was w -8 px). The
  entries under the card start 4 px higher.
