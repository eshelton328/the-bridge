# M21 deviations

What still differs from Figma M21 · Proposed new tasks (`tasksProposedPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (21 strings checked, 2 excepted in `exceptions.json`).
- Position: 2 of 10 layers pass (`nav`, `chevron · open task`).
- Rules: pass (1 finding under exceptions.json).

## Failing layers

Render minus Figma, in px. The position check renders the page 38 px
shorter, below Figma's status bar, and adds 38 to each render y (d-101).

- `task · discussing`: x +0, y -1, w +0, h +12.
- `model and context`: x +4, y +3, w +9.6, h +4.
- `guard`: x +4, y +6, w -8, h +3.
- `discussion`: x +0, y +27, w +0, h -96.
- `message · you`: x +0, y +13, w +0, h +1.
- `message · discussion`: x +0, y +14, w +0, h +6.
- `proposal · CREATE 3 TASKS`: x +0, y +20, w +0, h +60.
- `composer · discussion`: x +0, y +24, w +0, h +3.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 38 px shorter and adds
  38 to each render y (d-101), so a layer anchored to the top or to the
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
- **Reply box.** The reply box comes last, under the proposal, as Figma
  draws it; in the check it sits 24 px lower (`composer · discussion`
  y +24; Page fits says why). The story focuses the
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
  taller (`message · you`, `message · discussion` h). The reply's
  author, "Discussion" (402:7270), is `label` (Medium 14); Figma sets it
  in SemiBold 12/16, which no text style is. Library gap:
  Message author icon and small text.
- **Proposal block.** `ProposalBlock` as in T18 to T23; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **New tasks.** As in T20: each box is a `Checkbox` with the meta line
  under its title; `Checkbox` keeps a 32 px row for the touch target and
  sets its label in `body`, so each box is 66 high against Figma's 52
  and the block 60 px taller (`proposal · CREATE 3 TASKS` h +60). Library
  gap: Message author icon and small text.
- **Page fits.** The page used to be 8 px taller than the phone and
  scrolled (`hiddenOverflow` on `main.app-shell__detail`). With the card
  8 under the nav, as Figma draws it, the page fits the 844 px frame.
  The position check renders 38 px shorter (d-101), and there the page
  is taller than the screen: the reply box follows the proposal, 24 px
  lower than Figma's and 3 px taller (`composer · discussion` y +24,
  h +3). On M18 and M24 it sits at the bottom, 6 px higher (y -6).
- **Checked boxes.** The checked new-task boxes are cyan
  (`accent.default`); Figma fills them violet. `Checkbox` has no tone
  prop. Library gap: Proposal block icon and applied tone. The box is
  16 px, as Figma's (402:7278 is 16 × 16). `Checkbox size="sm"` keeps
  the box at 16 and the row at 32, so it would not make the box
  shorter, and its 12 px label is as far from Figma's 13 as `body` 14
  is; the boxes keep `body`.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
