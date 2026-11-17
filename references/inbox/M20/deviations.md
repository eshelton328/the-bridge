# M20 deviations

What still differs from Figma M20 · The task after Apply (`changeAppliedPage`), after the last
fidelity run (`pnpm fidelity inbox M20`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (35 strings checked, 3 excepted in `exceptions.json`).
- Position: 2 of 14 layers pass (`sticky action`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -36, w +0, h +66; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -32, w +0, h +5; 38 px removed: y +6.
- `section · WHY`: x +0, y -25, w +0, h +2; 38 px removed: y +13.
- `section · SUGGESTED PROMPT`: x +0, y -21, w +0, h +1; 38 px removed: y +17.
- `change history`: x +0, y -18, w +75, h -2; 38 px removed: y +20.
- `section · RUN IN`: x +0, y -18, w +0, h -17; 38 px removed: y +20.
- `button · Change`: x +0, y -27.5, w -2, h +4; 38 px removed: y +10.5.
- `section · MY NOTES`: x +0, y -33, w +0, h +7; anchored to the bottom, no status bar offset.
- `notes field`: x +0, y -31, w +0, h +5; anchored to the bottom, no status bar offset.
- `section · SOURCES`: x +0, y +122, w +0, h +2; 38 px removed: y +160.

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
- **Same page as M2.** The task page is M2's (`taskPage`), so its
  differences are M2's, with the same causes: `nav` h -8 (`BackRow` and
  32 px buttons against Figma's 40 px row); the sections 20 apart
  against Figma's 18 and the 20/28 title against 22 px (d-072; Library
  gaps: Small text in the detail, 22 px title); the Run in card with
  Recommended beside its title, 17 px shorter (`section · RUN IN` h -17)
  and Change 28 × 28 (`button · Change`; Library gaps: Small icon button,
  Pill height); Reset faded whole while disabled (Library gap: Disabled
  button style); the prompt cut by `Clamp` with an ellipsis (Library
  gap: Prompt fade without an ellipsis); My notes and Sources below the
  fold, where the page scrolls under the pinned Start (`section · MY
  NOTES`, `notes field`, `section · SOURCES`), and the task frame running
  on under Start (`task · next step` h). The exceptions say why the cut
  prompt and the scrolled page pass.
- **Discuss in the nav.** On the phone Discuss sits in the nav before
  Snooze and Dismiss, as Figma draws it (402:1945); it is the library
  `Button` at its default size, 32 high. Figma draws it in violet with a
  violet border; the library's button is the neutral secondary one.
  Library gap: Discuss toggle. It opens the discussion page (M18), with
  no tab bar; `InboxRoute.test.tsx` checks it on the phone.
- **Start.** Pinned above the tab bar, full width, as in M2 (`sticky
  action` passes); the bar is opaque.
- **Change line.** On the phone the line "Changed in a discussion ·
  just now" with Undo sits under Read the whole prompt, 8 below it, as
  Figma draws it (402:2440); the tablet keeps it beside the link. The
  line's box takes the column's width in the `Stack`, where Figma's
  hugs its text (`change history` w +75); it starts lower by what the
  sections above add (`change history` y). Undo takes the change back.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
