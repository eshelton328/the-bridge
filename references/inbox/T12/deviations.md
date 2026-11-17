# T12 deviations

What still differs from Figma T12 · Edit the prompt, choose where it runs (the prompt in its editor and the Run in picker open on the task page, `promptEditingPage`, D3 `promptEditing` with T2's notes), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (59 strings; 1 excepted in `exceptions.json`).
- Position: 1 of 13 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h -19; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h -2; 29 px removed: y -2.
- `title block`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `section · WHY`: x +2, y -25, w -4, h +2; 29 px removed: y +4.
- `section · SUGGESTED PROMPT`: x +2, y -21, w -4, h -12; 29 px removed: y +8.
- `section · RUN IN`: x +2, y -31, w -4, h +1; 29 px removed: y -2.
- `start`: x +2, y -28, w -4, h -1; 29 px removed: y +1.
- `section · MY NOTES`: x +2, y -27, w -4, h +7; 29 px removed: y +2.
- `notes field`: x +2, y -25, w -4, h +5; 29 px removed: y +4.
- `section · SOURCES`: x +2, y -18, w -4, h +2; 29 px removed: y +11.
- `run in picker`: x -4, y -29.5, w +0, h +5; 29 px removed: y -0.5.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets above give the rest as "29 px removed". Measuring below the
  status bar is an open request to Erik. Library gap: Top and bottom
  safe areas on the tablet.
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
  higher. Library gap: Small text in the detail. The Edited pill beside
  the heading is 20 px high, as Figma's (`Badge size="sm"`, beta.5).
- **Offsets that beta.5 exposed.** The Recommended pill in the Run in
  card is now 20 px high, as Figma's (`Badge size="sm"`, 24 before), so
  the card is 1 px taller instead of 5 (`section · RUN IN` h +1) and the
  task 4 px shorter (`task · next step` h -15 to -19). The layers below
  it move up 4 px and further from Figma's y (`start` y -24 to -28,
  `section · MY NOTES` y -23 to -27, `notes field` y -21 to -25,
  `section · SOURCES` y -14 to -18): these are the existing offsets of
  the shorter prompt editor and the status bar above, no longer hidden
  by the taller pill. The picker opens under Change, which sits 2 px
  higher in the shorter card (`run in picker` y -27.5 to -29.5).
- **Text caret.** Figma draws the editor's caret as a "|" after the
  prompt (346:8169); `exceptions.json` excepts that string, and the
  story checks the editor's text.
- **Run in picker.** As in D03: `OptionList size="sm"` rows in the
  picker make it 5 px taller (`run in picker` h +5, 9 before beta.5's
  20 px pills), within the
  library's own row and group heights; it opens under Change
  (`placement="bottom-end"`), 4 px to the left, under the wider Change
  button (button labels). Its search field sets the text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's 13 px placeholder.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Reset, Done, Change and the other small buttons
  keep the 14 px `label`; Figma sets them in Medium 12, which no text
  style has (d-050), so they are a little wider. Library gap: Button
  label size.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The prompt editor not focused (F1, P1): fixed. The story focuses the editor after its checks, as Erik sees it while he edits, and checks that the Run in picker stays open; the render shows `TextArea`'s focused border (`border.focus`). Playwright hides the caret. The review saw Figma's focused border heavier than the library's 1 px one. Library gap: Styles that differ from Figma.
- The picker's search placeholder "Search workspaces and chats" and its footer note larger and lighter (F2): stays. `SearchField` drew the placeholder in `body` (14) against Figma's 13 (fixed by beta.5: `SearchField textSize="sm"` sets it in `bodySm`, 13 px); its colour stays `fg.subtle` by d-055; the note is the popover's `small` note in `fg.muted`, the role Figma's #4a5675 has on `surface.overlay` (library gap: Styles that differ from Figma).
- Black shapes and a stray text line over the Figma side: a defect of the side-by-side picture, not of the reference or the render. See below.

## Side-by-side image

The second review saw the open Run in picker's icons and text drawn unstyled
on the Figma side of `T12.sideBySide.png`; the saved `frame.png` and
the render side did not have them. #13 changed `composeSideBySide` in
`scripts/fidelity/fidelity.ts` to draw the side-by-side in a fresh
page. After this branch was rebased onto it, `pnpm fidelity inbox T12`
draws the Figma side of `T12.sideBySide.png` without them.
