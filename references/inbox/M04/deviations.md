# M04 deviations

What still differs from Figma M4 · Choose where it runs (M2's task page with the Run in sheet, `runInSheet`), after the last
fidelity run (`pnpm fidelity inbox M04`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (45 strings checked; 3 Figma strings under exceptions.json).
- Position: 0 of 14 layers pass (none).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -38, w +0, h +166; 38 px removed: y +0.
- `task bar`: x +0, y -38, w +0, h +2; 38 px removed: y +0.
- `title block`: x +0, y -34, w +0, h +5; 38 px removed: y +4.
- `section · WHY`: x +0, y -27, w +0, h +2; 38 px removed: y +11.
- `section · SUGGESTED PROMPT`: x +0, y -23, w +0, h +22; 38 px removed: y +15.
- `section · RUN IN`: x +0, y +1, w +0, h -17; 38 px removed: y +39.
- `button · Change`: x +0, y -8, w -2, h +4; 38 px removed: y +30.
- `section · MY NOTES`: noLayer
- `notes field`: noLayer
- `section · SOURCES`: x +0, y +96, w +0, h +2; 38 px removed: y +134.
- `sticky action`: x +0, y -54, w +0, h -23; anchored to the bottom, no status bar offset.
- `tab bar`: noLayer
- `run in picker`: x +0, y -37, w +0, h +37; 38 px removed: y +1.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is 38 px higher (`y -38`). The position check measures from the
  frame's top, so no phone frame can pass it; the offsets above give
  the rest as "38 px removed". The open request
  `projects/ncc-1701/inbox/fidelity-status-bar-offset.md` in Erik's
  brain asks how to measure it (it names the phone frames too).
  Library gap: Top and bottom safe areas on the phone.
- **Nav.** `BackRow` with Snooze and Dismiss as 32 px icon buttons is
  32 px high against Figma's 40 (`nav` h -8); 12 below it the task
  starts 2 px lower than Figma's (`task · next step` y +2 with the
  status bar removed).
- **Detail spacing.** As in M2: sections are 20 px apart against
  Figma's 18 (d-072: a tie takes the larger token), the title is
  `title` (20/28) against Figma's 22 px and the prompt's lines are 20
  px against 21, so each section starts a little lower than the one
  above it (`title block` +4, `section · WHY` +11, `section · SUGGESTED
  PROMPT` +15 with the status bar removed). Figma's M4 prompt has no Read the whole prompt under it
  (346:9682 is 169 high); the render keeps M2's link, so the section is
  taller (`section · SUGGESTED PROMPT` h +22) and Run in starts lower
  (`section · RUN IN` y +39, `button · Change` y +30). Library gaps:
  Small text in the detail, 22 px title.
- **Run in card.** The render puts the Recommended pill beside the
  title, as on the desktop and tablet; Figma's phone card puts it on its
  own line under the detail (346:9709 in M4), so the card is 17 px
  shorter (`section · RUN IN` h -17). Change is
  `Button size="sm" iconOnly`, 28 × 28 against Figma's 30 × 24
  (`button · Change` w -2, h +4). Library gaps: Small icon button, Pill
  height.
- **Prompt.** `Clamp` cuts the prompt after five lines with an ellipsis
  and its fade; Figma cuts the text box at 128 px under a fade
  (346:9300). The exception says why the cut text passes.
- **Under the sheet.** M4 draws M2's page with no tab bar, no My notes
  and Start at the very bottom (346:9736 at y 752, 92 high). The render
  keeps M2's page under the sheet: the tab bar, My notes and Start above
  the tab bar (`sticky action` y -54, h -23; `tab bar`, `section · MY
  NOTES` and `notes field` have no layer in M4). The sheet covers all of
  them; the exceptions name the covered text. The task frame runs on to
  the end of the page (`task · next step` h +166) and Sources lies below
  the fold (`section · SOURCES`).
- **Run in sheet.** `BottomSheet` titled Run in with Done, the picker's
  search, sections and note. The rows and the section labels
  (`GroupHeader`, 26 px) are a little taller than Figma's, so the picker
  is 37 px taller (`run in picker` h +37) and the sheet starts higher.
  Done shows the focus ring: the sheet focuses its first control.
  Figma sets the note "Shells are not listed…" on a panel one step
  lighter than the sheet (346:9822, #101727 on #0f1526); no surface
  token is that close, so the note has none. Library gap: Picker note
  panel on the phone.
  Library gaps: Bottom sheet sections and data attribute, Pill height.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
