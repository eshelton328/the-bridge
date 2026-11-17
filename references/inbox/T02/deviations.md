# T02 deviations

What still differs from Figma T2 · A next step (the next step on its own page, `taskPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 12 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y +4, w -4, h -9.
- `section · SUGGESTED PROMPT`: x +2, y +8, w -4, h -2.
- `section · RUN IN`: x +2, y +8, w -4, h +1.
- `start`: x +2, y +11, w -4, h -1.
- `section · MY NOTES`: x +2, y +12, w -4, h +7.
- `notes field`: x +2, y +14, w -4, h +5.
- `section · SOURCES`: x +2, y +21, w -4, h +2.

## Deviations

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
  above it.
- **What beta.5 changed.** Two changes that match Figma made the
  task 9 px shorter (`task · next step` h +0 to -9), so every layer
  below the prompt moved up, closer to Figma's y: the
  Recommended pill is now 20 px high, as Figma's (`Badge size="sm"`,
  24 before), so the Run in card is 1 px taller instead of 5
  (`section · RUN IN` h +1); and the prompt is five 20 px `bodySm`
  lines (100 px) where it was 105. The faded `Clamp` now cuts by height
  (#104), so the prompt's text style moved from an inline span, whose
  13 px text in the panel's 14 px line made 21 px lines, onto a block;
  Figma's lines are 21, which no token has. The prompt section is now
  within the tolerance (h -2). Start, MY NOTES, the notes field and
  SOURCES move up 9 px and still sit lower than Figma's (`start` y +11,
  `section · MY NOTES` y +12, `notes field` y +14, `section · SOURCES`
  y +21): the section spacing above. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4); 12 px under it puts the task bar 40 px below
  the row's top against Figma's 42.
- **My notes.** With no note yet, the notes are a 1-row `TextArea`
  (`notes field`), 5 px taller than Figma's 39 px field.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Snooze, Dismiss, Reset, Edit and Change take
  `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's Medium 12,
  and Start takes `textSize="smStrong"` (`labelSmStrong`, SemiBold
  13/16), Figma's SemiBold 13 (d-100). The labels match Figma's.
- **Disabled Reset.** Reset keeps its fill and `border.default` border
  with only its label and icon in `fg.muted`, as Figma draws it
  (346:5736); beta.5 (#105) stopped fading the whole button.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks enabled where Figma dims it: fixed. Reset brings back
  the suggested prompt, so it is disabled until Erik edits the prompt
  (`prompt.edited`), as Figma draws it (346:5736).
- The prompt's fifth line is not faded: stays. `Clamp` fades only a
  text it cuts, and the prompt's five lines hold all of it (the sheet in
  T8 shows the same whole text); Figma fades its fifth line anyway. The
  same holds in D01 to D21. (Since beta.5 a cut prompt fades with no
  ellipsis, #104.)
- Run in card lines 25 px apart and the card 68 px high against 20 and
  62: fixed in part. The detail line now follows the title row with no
  gap (title to detail 20 px, Figma 21.5). The card is still 5 px
  taller (`section · RUN IN` h +5): the Recommended pill is 24 px high
  against Figma's 20 (library gap: Pill height). (Fixed by beta.5: the
  pill is 20 px, `Badge size="sm"`, and the card is 1 px taller.)
- "Opens the new chat and sends the prompt." lighter than Figma's:
  stays. It is `fg.subtle` #7986a6 against Figma's #4a5675 (d-055).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.

`section · SOURCES` passed in the beta.4 run only because the check
then measured from the frame's top, above Figma's status bar, which
hid its layout offset. Measured below the bar (d-101), it fails at
y +21 (above).
