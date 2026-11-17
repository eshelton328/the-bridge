# T18 deviations

What still differs from Figma T18 · A proposed update (`changeProposedPage`, D15 on the discussion page), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (1 string excepted in `exceptions.json`).
- Position: 0 of 10 layers pass.
- Rules: pass.

## Failing layers

Render minus Figma, in px. The position check renders the page 29 px
shorter, below Figma's status bar, and adds 29 to each render y (d-101).

- `nav`: x +2, y +8, w -4, h -2.
- `model and context`: x -4.7, y +5, w +9.6, h +4.
- `task · discussing`: x +2, y +6, w -4, h +8.
- `chevron · open task`: x -6, y +9, w +0, h +0.
- `guard`: x +6, y +10, w -12, h +2.
- `discussion`: x +2, y +30, w -4, h -103.
- `message · you`: x +2, y +16, w +148, h +1.
- `message · discussion`: x +2, y +17, w +148, h -14.
- `proposal · UPDATE THIS TASK`: x +2, y +3, w +148, h -10.
- `composer · discussion`: x +2, y +20, w -4, h +3.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 29 px shorter and adds
  29 to each render y (d-101), so a layer anchored to the top or to the
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
  draws. Library gap: Message author icon and small text.
- **Proposal block.** `ProposalBlock` as in D15 to D19; Figma's spark
  icon before the eyebrow has no slot. Library gap: Proposal block icon
  and applied tone.
- **Behaviour.** Apply shows the task page with the new prompt (T19),
  Discard takes the proposal out, Edit first opens the prompt editor
  with the change filled in, and Undo takes the change back.
  `InboxRoute.test.tsx` checks each at 756 px.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reply box not focused (P1): checked, it is. The play test focuses the reply box and asserts `toHaveFocus`, and the capture shows the focused border: the reply box's top edge is #3a819d (`border.selected` over the fill) against #24314f unfocused. Figma's focused border is #6863b0, so the render's focus reads as a faint cyan line. Library gap: Composer focus.
- Reply placeholder lighter (P2/P3): recorded with the focus; Playwright hides the caret, and the placeholder is `Composer`'s own colour. Library gap: Composer focus.
- Model chip chevron thin and grey (P3): recorded. `ModelChip` draws its chevron in `fg.muted` and has no prop for Figma's heavier #e6ecff one. Library gap: Styles that differ from Figma.
