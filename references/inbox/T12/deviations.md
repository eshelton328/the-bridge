# T12 deviations

What still differs from Figma T12 · Edit the prompt, choose where it runs (the prompt in its editor and the Run in picker open on the task page, `promptEditingPage`, D3 `promptEditing` with T2's notes), after the last
fidelity run (`pnpm fidelity inbox T12`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (59 strings; 1 excepted in `exceptions.json`).
- Position: 1 of 13 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h -15; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h -2; 29 px removed: y -2.
- `title block`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `section · WHY`: x +2, y -25, w -4, h +2; 29 px removed: y +4.
- `section · SUGGESTED PROMPT`: x +2, y -21, w -4, h -12; 29 px removed: y +8.
- `section · RUN IN`: x +2, y -31, w -4, h +5; 29 px removed: y -2.
- `start`: x +2, y -24, w -4, h -1; 29 px removed: y +5.
- `section · MY NOTES`: x +2, y -23, w -4, h +7; 29 px removed: y +6.
- `notes field`: x +2, y -21, w -4, h +5; 29 px removed: y +8.
- `section · SOURCES`: x +2, y -14, w -4, h +2; 29 px removed: y +15.
- `run in picker`: x -4, y -27.5, w +0, h +9; 29 px removed: y +1.5.

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
  higher. Library gap: Small text in the detail.
- **Text caret.** Figma draws the editor's caret as a "|" after the
  prompt (346:8169); `exceptions.json` excepts that string, and the
  story checks the editor's text.
- **Run in picker.** As in D03: `OptionList size="sm"` rows in the
  picker make it 9 px taller (`run in picker` h +9), within the
  library's own row and group heights; it opens under Change
  (`placement="bottom-end"`), 4 px to the left, under the wider Change
  button (button labels).
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review

Not run by the builder: the caller hands `reports/fidelity/inbox/T12.sideBySide.png`
and these deviations to the fidelity-reviewer agent.
