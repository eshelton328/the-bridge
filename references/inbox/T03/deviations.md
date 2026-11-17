# T03 deviations

What still differs from Figma T3 · A question that blocks a chat (the question, `question`, shared with D2), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 10 layers pass (`nav · back`, `task bar`, `title block`, `blocking`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · question`: x +2, y -2, w -4, h +24.
- `section · CONTEXT`: x +2, y +5, w -4, h +2.
- `section · CHOOSE ONE`: x +2, y +9, w -4, h +3.
- `section · NOTE TO THE CHAT · OPTIONAL`: x +2, y +14, w -4, h +3.
- `answer`: x +2, y +19, w -4, h -1.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 6` (read with `use_figma`, T2 346:5683, T3 346:5911, T4 346:6144), so it ends 28 px under its last section. The build now pads the task the same way: 6 at the top (the Back row's margin is 6, not 12, so the task bar stays 40 under the row's top) and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). `task · question` h +24 is 4 px from the 32 against Figma's 28; the rest is the content's own excess: the sections are 24 apart against Figma's 22 (d-072), and the section labels and text lines are on the 4 px grid (16 against Figma's 14 and 17, d-100). Before, the missing padding hid that excess.
- **Waiting card title (step 13).** The card's title is Geist Medium 13 in Figma (T3 346:5911), `labelSm` (13/16) here, not `label`, so the card is 56 high: Figma's 55 on the 4 px grid. `blocking` passes, and each layer under it moves 4 px up.
- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Detail spacing.** As in D01: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), and the prompt's 20 px lines against
  Figma's 21, so each section starts about 2 px lower than the one
  above it. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4); 12 px under it puts the task bar 40 px below
  the row's top against Figma's 42.
- **Waiting box.** `Panel tone="needsYou"` is 9 px taller than Figma's
  (`blocking` h +9). Its tint is 0.08, Figma's (library #107). Its
  border is `status.needsYou.border` at 0.5 against Figma's 0.35,
  because 0.35 gives 2.0:1 against the tint and a border needs 3:1
  (d-100).
- **What beta.5 changed.** The Recommended pill in the selected
  option card is now 20 px high, as Figma's (`Badge size="sm"`, 24
  before), so CHOOSE ONE is 3 px taller than Figma's instead of 7
  (`section · CHOOSE ONE` h +3) and the task 4 px shorter
  (`task · question` h +0 to -4). The note section below moves up 4 px,
  closer to Figma's y, and still sits lower by the section spacing
  above (`section · NOTE TO THE CHAT · OPTIONAL` y +24).
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Snooze, Dismiss and the waiting box's Open chat
  take `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's
  Medium 12 (d-100). The labels match Figma's.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- "Open chat" a dark filled button where Figma's is outlined: stays.
  It is the `secondary` button with Figma's own fill (#17213a,
  `surface.raised`, sampled from both pictures); it reads as filled
  because the waiting box's needs-you tint is lighter than Figma's
  (#302b2d against #1a191b). (Fixed by beta.7: the tint is Figma's
  0.08, library #107.)
- "Sends your answer to the waiting chat." lighter than Figma's: stays.
  `fg.subtle` #7986a6 against #4a5675 (d-055).
- The selected option card 5 px taller than Figma's: stays. Its
  Recommended pill is 24 px high against Figma's 20 (library gap: Pill
  height). (Fixed by beta.5: the pill is 20 px, `Badge size="sm"`, and
  the section is 3 px taller than Figma's.)
- The waiting box's icon and text 4 px further in, Open chat 4 px
  further from the right: stays. `Panel` pads 16 at the sides against
  Figma's 13 (library gap: Panel and text field padding).
- The note field's text inset 11 px against 15: stays. `TextArea` pads
  10 and 8 against Figma's 15 and 13 (same library gap).
- The note text near-white against Figma's light grey: stays.
  `TextArea` draws its value in `fg.default`; Figma draws the note in
  #8a97b8 (`fg.muted`; same library gap).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.
- **Beta.18 (2026-11-17, step 12).** `task · question` changes from a
  pass to h -10. The waiting card is now 60 high (`Panel
  variant="notice"`, library #122; Figma 55), 4 px less than before, and
  the pill 2 px less. Figma's tablet task frames end 28 px under their
  last child (T2, T4, T13 and this frame, 346:5911); the build's frame
  ends at its last child, so T2, T4 and T13 already show h -11 to -15.
  Before, the card's extra height hid that difference here. A 32 px
  bottom pad (d-072) would make T2, T4 and T13 21 px too tall, so the
  frame keeps no pad.
