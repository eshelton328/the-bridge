# T08 deviations

What still differs from Figma T8 · Read the whole prompt (the prompt in a sheet, `promptSheet`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108; updated on 2026-11-17 with library 1.0.0-beta.8, #109, and no layer of this frame moved), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 16 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y -2, w -4, h +27.
- `section · SUGGESTED PROMPT`: x +2, y +6, w -4, h -2.
- `section · RUN IN`: x +2, y +6, w -4, h +1.
- `start`: x +2, y +9, w -4, h -1.
- `section · MY NOTES`: x +2, y +10, w -4, h +7.
- `notes field`: x +2, y +12, w -4, h +5.
- `section · SOURCES`: x +2, y +19, w -4, h +2.
- `346:7179`: x -6, y -5, w +12, h +6.
- `sheet actions`: x -6, y -1, w +12, h +1.
- `button · Edit prompt`: x -6, y -1, w +6, h +1.
- `button · Copy`: x +0, y -1, w +6, h +1.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 6` (read with `use_figma`, T2 346:5683, T3 346:5911, T4 346:6144), so it ends 28 px under its last section. The build now pads the task the same way: 6 at the top (the Back row's margin is 6, not 12, so the task bar stays 40 under the row's top) and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). `task · next step` h +27 is 4 px from the 32 against Figma's 28; the rest is the content's own excess: the sections are 24 apart against Figma's 22 (d-072), and the section labels and text lines are on the 4 px grid (16 against Figma's 14 and 17, d-100). Before, the missing padding hid that excess.
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
  `button · Edit prompt` x -6; library gap: Sheet inset on the tablet). The prompt is `bodyLg`
  (Regular 15/24) against Figma's Regular 15 with 23 px lines, the 4 px
  grid value (d-100), so it is 6 px taller (`346:7179` h +6) and starts
  5 px higher, since the sheet is anchored to the bottom (y -5).
- **Focus.** Ark focuses the first control when the sheet opens, Done,
  so Done shows a focus ring; Figma shows none (as D08).
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Snooze, Dismiss, Reset, Edit and Change behind the
  sheet take `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's
  Medium 12, and Start takes `textSize="smStrong"` (`labelSmStrong`,
  SemiBold 13/16), Figma's SemiBold 13 (d-100). The sheet's Edit prompt
  and Copy are `size="xl"` with `textSize="sm"` (Medium 13/16), as
  Figma sets them (346:7187, 346:7193, read from Figma; library #109,
  beta.8). The labels match; the buttons' boxes follow the sheet's
  inset, as before (`button · Edit prompt`, `button · Copy`).
- **Disabled Reset.** Reset behind the sheet keeps its fill and
  `border.default` border with only its label and icon in `fg.muted`, as
  Figma draws it; beta.5 (#105) stopped fading the whole button.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108), with this branch's app changes, move these layers: `346:7179` x -6, y -5, w +12, h +6 (was x
  -6, y +39, w +12, h -38). The cause is the whole prompt in `bodyLg`
  (Regular 15/24, d-100; Figma 15/23; was `body`, 14/20).

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
