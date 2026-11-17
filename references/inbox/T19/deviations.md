# T19 deviations

What still differs from Figma T19 · The task after Apply (`changeAppliedPage`, T18 after Apply), after the last
fidelity run (`pnpm fidelity inbox T19`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 1 of 13 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h -38; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h +2; 29 px removed: y -2.
- `title block`: x +2, y -27, w -4, h +4; 29 px removed: y +2.
- `section · WHY`: x +2, y -21, w -4, h +2; 29 px removed: y +8.
- `section · SUGGESTED PROMPT`: x +2, y -17, w -4, h -39; 29 px removed: y +12.
- `change history`: x -3.1, y -55, w -1.1, h +0; 29 px removed: y -26.
- `section · RUN IN`: x +2, y -54, w -4, h +5; 29 px removed: y -25.
- `start`: x +2, y -47, w -4, h -1; 29 px removed: y -18.
- `section · MY NOTES`: x +2, y -46, w -4, h +7; 29 px removed: y -17.
- `notes field`: x +2, y -44, w -4, h +5; 29 px removed: y -15.
- `section · SOURCES`: x +2, y -37, w -4, h +2; 29 px removed: y -8.

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
  Figma's 22 (no 22 token, d-072), and the prompt's 20 px lines against
  Figma's 21, so each section starts about 2 px lower than the one
  above it. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4). Library gaps: Small text in the detail, Pill
  height (the Recommended pill makes the Run in card 5 px taller).
- **Discuss.** Figma draws Discuss in violet (402:11096 in T16); the
  library has no discuss toggle, so it is a secondary `Button`, 32 px
  high against Figma's 30 (`task bar` h +2). Library gap: Discuss
  toggle.
- **My notes.** With no note yet, the notes are a 1-row `TextArea`
  (`notes field`), 5 px taller than Figma's 39 px field.
- **Changed prompt.** The prompt box hugs the three lines of the new
  prompt (`Clamp` sets a maximum of five lines, not a height), so the
  box is 39 px shorter than Figma's, which keeps the five-line height
  of the old prompt (`section · SUGGESTED PROMPT` h -39). Every section
  below it starts higher by that much. The change line ("Changed in a
  discussion · just now" with Undo) is in place beside Read the whole
  prompt (`change history`), and Undo takes the change back.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
