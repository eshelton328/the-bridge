# M19 deviations

What still differs from Figma M19 · A proposed update (`changeProposedPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108; updated on 2026-11-17 with library 1.0.0-beta.9, #110 and #111), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (22 strings checked, 2 excepted in `exceptions.json`).
- Position: 2 of 10 layers pass (`nav`, `chevron · open task`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · discussing`: x +0, y -1, w +0, h +12.
- `model and context`: x +4, y +3, w +6.4, h +4.
- `guard`: x +4, y +6, w -8, h +3.
- `discussion`: x +0, y +27, w +0, h -126.
- `message · you`: x +0, y +13, w +0, h +2.
- `message · discussion`: x +0, y +15, w +0, h +2.
- `proposal · UPDATE THIS TASK`: x +0, y +17, w +0, h +4.
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
  h). Library gap: Chat header on the tablet.
- **Task card under the nav.** The card sits 8 under the nav, as
  Figma draws it (was 16), so it is within 1 px of Figma
  (`task · discussing` y -1). Every layer under it moved up 8 too.
- **Task card.** A `Panel` with the title, cut on one line with an
  ellipsis as Figma cuts it (TruncatedText; the exception says why the
  cut title passes), the Next step pill, a chevron, the place, the model
  and context and the guard. The `Panel` pads 16 against Figma's 12 and
  its rows are 4 apart against Figma's 5, so the card is 12 px taller
  (`task · discussing` h +12), the chevron 4 px left (`chevron · open
  task` x -4) and the guard 4 px right (`guard` x +4, w -8). Every
  entry under the card starts lower by what the card adds. Library gap:
  Chat header on the tablet.
- **Reply box.** The reply box sits above the home indicator, as Figma
  draws it (`composer · discussion` within 6 px). The story focuses the
  composer, as Figma draws it with a caret; the focused border is cyan,
  not Figma's lighter grey (Library gap: Composer focus). Send adds
  Erik's message to the discussion and empties the box
  (`InboxRoute.test.tsx`); nothing answers it in this mock-up. The box
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
  (402:2208), is `labelXsStrong` (SemiBold 12/16), as Figma's.
- **Proposal block.** `ProposalBlock` as in T18 to T23; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **Behaviour.** Apply shows the task page with the new prompt (M20),
  Discard takes the proposal out, Edit first opens the prompt editor
  with the change filled in (M3), as on the tablet; the tablet tests in
  `InboxRoute.test.tsx` use the same screen.
- **Button labels.** The proposal's Apply, Discard and Edit first are
  `ProposalBlock`'s own `size="sm"` buttons in `labelXs` (Medium 12/16),
  as Figma sets them (library beta.9). `Composer`'s send is larger than
  Figma's 26 × 26. Library gap: Button label size.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `message · discussion` x +0, y +15, w +0, h
  +2 (was x +0, y +15, w +0, h +6); `proposal · UPDATE THIS TASK` x
  +0, y +17, w +0, h +4 (was x +0, y +21, w +0, h +4). The cause is
  the discussion reply's author name in `labelXsStrong` (SemiBold
  12/16, Figma's; was `label`, Medium 14/20), a 4 px shorter line.
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) draws
  `ProposalBlock`'s own buttons (Apply, Discard, Edit first) in
  `labelXs` (Medium 12/16), as Figma's (was `label`, Medium 14/20). No
  layer of this frame moved.
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
