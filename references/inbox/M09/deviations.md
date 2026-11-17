# M09 deviations

What still differs from Figma M9 · Read the whole prompt (the prompt in a sheet over the phone's task page, `promptSheet`), after the last
fidelity run (`pnpm fidelity inbox M09`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (31 strings checked; 1 Figma strings under exceptions.json).
- Position: 3 of 17 layers pass (`sheet actions`, `button · Edit prompt`, `button · Copy`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -36, w +0, h +147; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -32, w +0, h +5; 38 px removed: y +6.
- `section · WHY`: x +0, y -25, w +0, h +2; 38 px removed: y +13.
- `section · SUGGESTED PROMPT`: x +0, y -21, w +0, h +3; 38 px removed: y +17.
- `section · RUN IN`: x +0, y -16, w +0, h -17; 38 px removed: y +22.
- `button · Change`: x +0, y -25.5, w -2, h +4; 38 px removed: y +12.5.
- `section · MY NOTES`: noLayer
- `notes field`: noLayer
- `section · SOURCES`: x +0, y +98, w +0, h +2; 38 px removed: y +136.
- `sticky action`: x +0, y -54, w +0, h -23; anchored to the bottom, no status bar offset.
- `tab bar`: noLayer
- `346:10794`: x +0, y +54, w +0, h -53; anchored to the bottom, no status bar offset.

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
- **Nav and detail.** As in M02: the nav is 32 px high against Figma's
  40 (`nav` h -8); sections are 20 apart against Figma's 18 (d-072), the
  title is `title` (20/28) against Figma's 22 px and the prompt's lines
  are 20 px against 21, so each section starts a little lower (`title
  block` +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17,
  `section · RUN IN` +22 with the status bar removed). The Run in card
  puts Recommended beside the title (`section · RUN IN` h -17) and
  Change is 28 × 28 against 30 × 24 (`button · Change` w -2, h +4).
  Reset is disabled and fades its border too. Library gaps: Small text
  in the detail, 22 px title, Small icon button, Pill height, Disabled
  button style.
- **Under the sheet.** M9 draws M2's page with no tab bar, no My notes
  and Start at the very bottom (346:10779 at y 752, 92 high). The render
  keeps M2's page under the sheet: the tab bar, My notes and Start above
  the tab bar (`sticky action` y -54, h -23; `tab bar`, `section · MY
  NOTES` and `notes field` have no layer in M9). The sheet and its scrim
  cover all of them; the exceptions name the covered text. The task
  frame runs on to the end of the page (`task · next step` h +147) and
  Sources lies below the fold (`section · SOURCES` y +136 with the
  status bar removed); Figma keeps a hidden SOURCES section at y 623.
- **Prompt sheet.** `BottomSheet` titled Suggested prompt with Done,
  the whole prompt, the read-only hint, and Edit prompt and Copy
  (`sheet actions`, `button · Edit prompt` and `button · Copy` pass).
  Figma sets the prompt in Regular 15 with 23 px lines (346:10794, 253
  high); the render uses `body` (14/20), so the text is 53 px shorter
  and the sheet starts lower (`346:10794` y +54, h -53). Done shows the
  focus ring: the sheet focuses its first control. Library gaps:
  Regular 15 px text, Bottom sheet sections and data attribute.
- **What the buttons do.** Edit prompt closes the sheet and opens the
  prompt editor with the focus in it (M3); Copy copies the whole prompt
  (`InboxRoute.test.tsx`). A sent prompt's sheet (M10) has Copy only.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
