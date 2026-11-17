# T12 deviations

What still differs from Figma T12 · Edit the prompt, choose where it runs (the prompt in its editor and the Run in picker open on the task page, `promptEditingPage`, D3 `promptEditing` with T2's notes), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.7, which has #107 and #108; updated on 2026-11-17 with library 1.0.0-beta.9, #110 and #111), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (59 strings; 1 excepted in `exceptions.json`).
- Position: 7 of 13 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `section · RUN IN`, `start`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y +4, w -4, h -19.
- `section · SUGGESTED PROMPT`: x +2, y +8, w -4, h -12.
- `section · MY NOTES`: x +2, y +2, w -4, h +7.
- `notes field`: x +2, y +4, w -4, h +5.
- `section · SOURCES`: x +2, y +11, w -4, h +2.
- `run in picker`: x -4, y -0.5, w +0, h +5.

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
- **Detail spacing.** As in T02: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), so each section starts a little lower
  than the one above it. The title is `title` (20/28) against Figma's
  22 px (library gap: 22 px title). `BackRow` is 28 px high against
  Figma's 32 (`nav · back` h -4).
- **Prompt editor.** As in D03: `TextArea textSize="sm"` pads 8 px
  above and below with 20 px lines, where Figma's field is taller with
  21 px lines and a 15 px inset, so the section is 12 px shorter
  (`section · SUGGESTED PROMPT` h -12) and the sections below start
  higher than the section spacing alone would put them. Library gap: Small text in the detail. The Edited pill beside
  the heading is 20 px high, as Figma's (`Badge size="sm"`, beta.5).
- **What beta.5 changed.** The Recommended pill in the Run in
  card is now 20 px high, as Figma's (`Badge size="sm"`, 24 before), so
  the card is 1 px taller instead of 5 (`section · RUN IN` h +1) and the
  task 4 px shorter (`task · next step` h -15 to -19). The layers below
  it move up 4 px, closer to Figma's y: `start` is within the
  tolerance, and `section · MY NOTES` (y +2), `notes field` (y +4) and
  `section · SOURCES` (y +11) sit lower by the section spacing, less
  the shorter prompt editor. The picker opens under Change, which sits
  2 px higher in the shorter card (`run in picker` y -0.5).
- **Text caret.** Figma draws the editor's caret as a "|" after the
  prompt (346:8169); `exceptions.json` excepts that string, and the
  story checks the editor's text.
- **Run in picker.** As in D03: `OptionList size="sm"` rows in the
  picker make it 5 px taller (`run in picker` h +5, 9 before beta.5's 20
  px pills), within the library's own row and group heights; it opens
  under Change (`placement="bottom-end"`), 4 px to the left of Figma's
  (`run in picker` x -4). Change now has Figma's Medium 12 label, and
  the offset did not move with it. Its search field sets the text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's 13 px placeholder. Since beta.9 it is `Popover
  surface="raised"`: an opaque `surface.raised` fill (#17213a), as Figma
  fills it (D3 346:1234), so the page no longer shows through it.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Snooze, Dismiss, Reset, Done and Change take
  `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's Medium 12,
  and Start takes `textSize="smStrong"` (`labelSmStrong`, SemiBold
  13/16), Figma's SemiBold 13 (d-100). The labels match Figma's.
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) gives the
  Run in picker an opaque fill: `Popover surface="raised"`
  (`surface.raised`, #17213a, Figma's; was `surface.overlay`, alpha
  0.98). No layer of this frame moved.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The prompt editor not focused (F1, P1): fixed. The story focuses the editor after its checks, as Erik sees it while he edits, and checks that the Run in picker stays open; the render shows `TextArea`'s focused border (`border.focus`). Playwright hides the caret. The review saw Figma's focused border heavier than the library's 1 px one. Library gap: Styles that differ from Figma.
- The picker's search placeholder "Search workspaces and chats" and its footer note larger and lighter (F2): stays. `SearchField` drew the placeholder in `body` (14) against Figma's 13 (fixed by beta.5: `SearchField textSize="sm"` sets it in `bodySm`, 13 px); its colour stays `fg.subtle` by d-055; the note is the popover's `small` note in `fg.muted`; Figma's #4a5675 is `fg.subtle`'s role, and `fg.subtle` is not for `surface.raised`, the picker's fill since beta.9 (d-055; library gap: Styles that differ from Figma).
- Black shapes and a stray text line over the Figma side: a defect of the side-by-side picture, not of the reference or the render. See below.

## Side-by-side image

The second review saw the open Run in picker's icons and text drawn unstyled
on the Figma side of `T12.sideBySide.png`; the saved `frame.png` and
the render side did not have them. #13 changed `composeSideBySide` in
`scripts/fidelity/fidelity.ts` to draw the side-by-side in a fresh
page. After this branch was rebased onto it, `pnpm fidelity inbox T12`
draws the Figma side of `T12.sideBySide.png` without them.
