# T08 deviations

What still differs from Figma T8 · Read the whole prompt (the prompt in a sheet, `promptSheet`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 16 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `tab bar`).
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
- `346:7179`: x -6, y +39, w +12, h -38.
- `sheet actions`: x -6, y -1, w +12, h +1.
- `button · Edit prompt`: x -6, y -1, w +6, h +1.
- `button · Copy`: x +0, y -1, w +6, h +1.

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
- **What beta.5 changed.** As in T2: two changes that match
  Figma made the task behind the sheet 9 px shorter (`task · next step`
  h +0 to -9). The Recommended pill is now 20 px high, as Figma's
  (`Badge size="sm"`, 24 before), so the Run in card is 1 px taller
  instead of 5 (`section · RUN IN` h +1); and the prompt is five 20 px
  `bodySm` lines (100 px) where it was 105. The faded `Clamp` now cuts by
  height (#104), so the prompt's text style moved from an inline span,
  whose 13 px text in the panel's 14 px line made 21 px lines, onto a
  block; Figma's lines are 21, which no token has. The prompt section is
  now within the tolerance (h -2). Start, MY NOTES, the notes field and
  SOURCES move up 9 px and still sit lower than Figma's (`start` y +11,
  `section · MY NOTES` y +12, `notes field` y +14, `section · SOURCES`
  y +21): the section spacing above. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4); 12 px under it puts the task bar 40 px below
  the row's top against Figma's 42.
- **Prompt sheet.** `BottomSheet` with Done at the end of the title
  row. It pads its content 12 and its header 16 against Figma's 23; the
  content takes 4 more, so the title and text share one left edge, 6 px
  left of Figma's (`346:7179` x -6, w +12; `sheet actions` x -6, w +12;
  `button · Edit prompt` x -6; library gap: Sheet inset on the tablet). The prompt is `body` (14/20)
  against Figma's Regular 15 with 23 px lines, so it is 38 px shorter
  (`346:7179` h -38) and starts 39 px lower, since the sheet is anchored
  to the bottom; Regular 15 text waits on Erik (library gap: Regular
  15 px text).
- **Focus.** Ark focuses the first control when the sheet opens, Done,
  so Done shows a focus ring; Figma shows none (as D08).
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Snooze, Dismiss, Reset, Edit, Change and the
  sheet's Edit prompt and Copy keep the 14 px `label`; Figma sets them in
  Medium 12, which no text style has (d-050), so they are a little wider.
  Library gap: Button label size.
- **Disabled Reset.** Reset behind the sheet keeps its fill and
  `border.default` border with only its label and icon in `fg.muted`, as
  Figma draws it; beta.5 (#105) stopped fading the whole button.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- The prompt card's fifth line, behind the sheet, is not faded: stays.
  `Clamp` fades only a text it cuts, and the prompt's five lines hold
  all of it (the sheet shows the same whole text); Figma fades its
  fifth line anyway. The same holds in D01 to D21. (Since beta.5 a cut
  prompt fades with no ellipsis, #104.)
- The sheet's title 4 px right of the prompt text: fixed. `BottomSheet`
  pads its header 4 more than its content, so the content takes 4 more
  and both start at x 17; Figma's share x 23 (`346:7179` x -6, was -10;
  library gap: Sheet inset on the tablet).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.
