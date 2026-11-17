# M03 deviations

What still differs from Figma M3 · Edit the prompt (the prompt in its editor with the keyboard, `promptKeyboard`), after the last
fidelity run (`pnpm fidelity inbox M03`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (14 strings checked; 14 Figma strings under exceptions.json).
- Position: 0 of 7 layers pass (none).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -38, w +0, h +40; 38 px removed: y +0.
- `scrolled title`: x +0, y -38, w +0, h -1; 38 px removed: y +0.
- `section · SUGGESTED PROMPT`: x +0, y -33, w +0, h -14; 38 px removed: y +5.
- `section · RUN IN`: x +0, y -41, w +0, h -17; 38 px removed: y -3.
- `button · Change`: x +0, y -50, w -2, h +4; 38 px removed: y -12.
- `section · SOURCES`: x +0, y -209, w +0, h +2; 38 px removed: y -171.

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
- **Keyboard.** Figma draws the iOS keyboard over the bottom of the
  screen (design chrome, d-089, excluded from the text check); the app
  draws none. While the editor is open on the phone the render hides
  the tab bar, Start and My notes, which the keyboard covers, and shows
  the title on one line over the prompt instead of the head and Why
  (`scrolled title`), as Figma does. Sources, which Figma keeps hidden
  under the keyboard (346:9508), shows below Run in (`section ·
  SOURCES` y -171), and the task frame ends there (`task · next
  step` h +40).
- **Nav.** As in M2: the nav is 32 px against 40 (`nav` h -8).
- **Editor.** The editor is not focused: the story does not focus it,
  so it has the plain border, not Figma's cyan focus border, and no
  caret. The editor is 14 px shorter (`section · SUGGESTED PROMPT`
  h -14): `TextArea textSize="sm"` pads 8 with 20 px lines. Library
  gap: Small text in the detail.
- **Run in card.** As in M2: the pill beside the title makes the card
  17 px shorter (`section · RUN IN` h -17), and Change is 28 × 28
  against 30 × 24 (`button · Change`). Library gaps: Small icon button,
  Pill height.
- **Hidden layers.** M3 keeps the task bar, title block and Why as
  hidden layers at y 94; the exceptions say why their text is not
  checked. Since an exception names a text, the visible scrolled title
  with the same text is not checked either (open request
  `fidelity-layer-scoped-exceptions`).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
