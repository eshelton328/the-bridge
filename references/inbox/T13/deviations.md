# T13 deviations

What still differs from Figma T13 · Snooze or dismiss (the Snooze menu open on the task page, `snoozePage`, T2 `taskPage`), after the last
fidelity run (`pnpm fidelity inbox T13`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (49 strings).
- Position: 2 of 13 layers pass (`section · SOURCES`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h +0; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h -2; 29 px removed: y -2.
- `title block`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `section · WHY`: x +2, y -25, w -4, h +2; 29 px removed: y +4.
- `section · SUGGESTED PROMPT`: x +2, y -21, w -4, h +3; 29 px removed: y +8.
- `section · RUN IN`: x +2, y -16, w -4, h +5; 29 px removed: y +13.
- `start`: x +2, y -9, w -4, h -1; 29 px removed: y +20.
- `section · MY NOTES`: x +2, y -8, w -4, h +7; 29 px removed: y +21.
- `notes field`: x +2, y -6, w -4, h +5; 29 px removed: y +23.
- `menu · Snooze or dismiss`: x -5, y -35, w +0, h +22; 29 px removed: y -6.

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
- **Snooze menu.** As in D12: `Menu size="lg" width="md"` has
  Figma's 320 px width and 44 px rows, but its heading and separator
  make it 22 px taller (`menu · Snooze or dismiss` h +22); it opens 5
  px further left, under the wider Snooze button (button labels).
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review

Not run by the builder: the caller hands `reports/fidelity/inbox/T13.sideBySide.png`
and these deviations to the fidelity-reviewer agent.
