# M05 deviations

What still differs from Figma M5 · A question that blocks a chat (the question on the phone, `questionPhone`), after the last
fidelity run (`pnpm fidelity inbox M05`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (29 strings checked; 1 Figma strings under exceptions.json).
- Position: 3 of 10 layers pass (`section · CONTEXT`, `sticky action`, `tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · question`: x +0, y -36, w +0, h +28; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -28, w +0, h +6; 38 px removed: y +10.
- `blocking`: x +0, y -16, w +0, h +9; 38 px removed: y +22.
- `section · CHOOSE ONE`: x +0, y +7, w +0, h +7; 38 px removed: y +45.
- `section · NOTE TO THE CHAT · OPTIONAL`: x +0, y +20, w +0, h +0; 38 px removed: y +58.

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
- **Nav.** As in M2: the nav is 32 px against 40 (`nav` h -8), and the
  task starts 2 px lower (`task · question` y +2, `task bar` y +2 with
  the status bar removed).
- **Detail spacing.** As in T3: the title is `title` (20/28) against
  Figma's 22 px (`title block` y +10, h +6), and sections are 24 px
  apart against Figma's 18, so each section starts lower. Library gaps:
  22 px title, Small text in the detail.
- **Waiting box.** `Panel tone="needsYou"` pads 16 against Figma's 13,
  so the box is 9 px taller (`blocking` h +9). The button says Open on
  the phone, Open chat on the desktop and tablet, as Figma does. Library
  gap: Panel and text field padding.
- **Options.** The option cards are a little taller (`section · CHOOSE
  ONE` h +7): the Recommended pill is 24 px against 20. Library gap:
  Pill height.
- **Answer.** Pinned above the tab bar, full width, without its hint,
  as Figma draws it (`sticky action` passes). The note to the chat lies
  under it, lower than Figma's (`section · NOTE TO THE CHAT · OPTIONAL`
  y +58 with the status bar removed); the page scrolls to it.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
