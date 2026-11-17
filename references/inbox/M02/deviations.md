# M02 deviations

What still differs from Figma M2 · A next step (the next step on the phone's task page, `taskPage`), after the last
fidelity run (`pnpm fidelity inbox M02`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (32 strings checked; 3 Figma strings under exceptions.json).
- Position: 2 of 13 layers pass (`sticky action`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -36, w +0, h +68; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -32, w +0, h +5; 38 px removed: y +6.
- `section · WHY`: x +0, y -25, w +0, h +2; 38 px removed: y +13.
- `section · SUGGESTED PROMPT`: x +0, y -21, w +0, h +3; 38 px removed: y +17.
- `section · RUN IN`: x +0, y -16, w +0, h -17; 38 px removed: y +22.
- `button · Change`: x +0, y -26, w -2, h +4; 38 px removed: y +12.
- `section · MY NOTES`: x +0, y -31, w +0, h +7; 38 px removed: y +7.
- `notes field`: x +0, y -29, w +0, h +5; 38 px removed: y +9.
- `section · SOURCES`: x +0, y +98, w +0, h +2; 38 px removed: y +136.

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
- **Detail spacing.** Figma sets the phone's sections 18 apart; the
  render sets them 20 (d-072: 18 is as far from 16 as from 20, and a
  tie takes the larger token). The title is `title` (20/28) against
  Figma's 22 px and the prompt's lines are 20 px against 21, so each
  section starts a little lower than the one above it (`title block`
  +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17 with the
  status bar removed). Library gaps: Small text in the detail, 22 px
  title.
- **Run in card.** The render puts the Recommended pill beside the
  title, as on the desktop and tablet; Figma's phone card puts it on its
  own line under the detail (346:9316), so the card is 17 px shorter
  (`section · RUN IN` h -17) and Change sits 10 px higher in it
  (`button · Change` y +12 against the card's +22). Change is
  `Button size="sm" iconOnly`, 28 × 28 against Figma's 30 × 24
  (`button · Change` w -2, h +4). Library gaps: Small icon button, Pill
  height.
- **Reset.** Reset is disabled until the prompt differs from the
  suggestion. Figma dims only its label and icon and keeps the border;
  a disabled `Button` fades the whole button, border included. Library
  gap: Disabled button style.
- **Prompt.** `Clamp` cuts the prompt after five lines with an ellipsis
  and its fade; Figma cuts the text box at 128 px under a fade
  (346:9300) and draws no ellipsis. `Clamp fade` keeps `line-clamp`,
  which draws the "…" in Chrome. The exception says why the cut text
  passes. Library gap: Prompt fade without an ellipsis.
- **Start.** Pinned above the tab bar, full width, as Figma draws it
  (`sticky action` passes); the hint "Opens the new chat and sends the
  prompt." is left out, as Figma does. The button is `size="xl"`. The
  bar is opaque, as Figma's: the chrome over the canvas, so the page
  that scrolls under it does not show through.
- **My notes and Sources.** The page scrolls under Start, as the note
  says. My notes starts lower than Figma's by what the sections above
  add, less the 17 px the Run in card saves (`section · MY NOTES` y +7,
  `notes field` y +9 with the status bar removed). Figma
  keeps a hidden SOURCES section at y 623 (346:9326); the render has
  Sources after My notes, below the fold (`section · SOURCES` y +136).
- **Task frame.** The task runs on under Start to the end of the page,
  so its box is taller than Figma's (`task · next step` h +68).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
