# M20 deviations

What still differs from Figma M20 · The task after Apply (`changeAppliedPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (35 strings checked, 3 excepted in `exceptions.json`).
- Position: 2 of 14 layers pass (`sticky action`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -36, w +0, h +57; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -32, w +0, h +5; 38 px removed: y +6.
- `section · WHY`: x +0, y -25, w +0, h +2; 38 px removed: y +13.
- `section · SUGGESTED PROMPT`: x +0, y -21, w +0, h -4; 38 px removed: y +17.
- `change history`: x +0, y -23, w +75, h -2; 38 px removed: y +15.
- `section · RUN IN`: x +0, y -23, w +0, h -21; 38 px removed: y +15.
- `button · Change`: x +0, y -34.5, w -2, h +4; 38 px removed: y +3.5.
- `section · MY NOTES`: x +0, y -42, w +0, h +7; anchored to the bottom, no status bar offset.
- `notes field`: x +0, y -40, w +0, h +5; anchored to the bottom, no status bar offset.
- `section · SOURCES`: x +0, y +113, w +0, h +2; 38 px removed: y +151.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is 38 px higher (`y -38`). The position check measures from the
  frame's top, so no phone frame can pass it; the offsets above give
  the rest as "38 px removed". The open request
  `projects/ncc-1701/inbox/fidelity-status-bar-offset.md` in Erik's
  brain asks how to measure it (it names the phone frames too).
  Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap: Top and bottom safe areas on the phone.
- **Same page as M2.** The task page is M2's (`taskPage`), so its
  differences are M2's, with the same causes: `nav` h -8 (`BackRow` and
  32 px buttons against Figma's 40 px row); the sections 20 apart
  against Figma's 18 and the 20/28 title against 22 px (d-072; Library
  gaps: Small text in the detail, 22 px title); the Run in card with
  Recommended beside its title, 21 px shorter (`section · RUN IN` h -21)
  and Change 28 × 28 (`button · Change`; Library gap: Small icon button);
  the prompt cut by `Clamp` at five lines and faded, with no "…" (#104);
  My notes and Sources below the
  fold, where the page scrolls under the pinned Start (`section · MY
  NOTES`, `notes field`, `section · SOURCES`), and the task frame running
  on under Start (`task · next step` h). The exceptions say why the cut
  prompt and the scrolled page pass.
- **Offsets beta.5 exposed.** Two changes that match Figma move the
  layers below the prompt up and show offsets the old sizes hid. The
  Recommended pill is 20 px (`Badge size="sm"`, as Figma's), not 24, so
  the Run in card is 4 px shorter: it was already shorter than Figma's,
  and the pill's extra 4 px hid part of that (`section · RUN IN` h -17 to
  -21). The prompt is five 20 px `bodySm` lines: the faded `Clamp` now
  cuts by height, so the prompt's text style moved from an inline span
  (its 13 px text in the panel's 14 px line made 21 px lines) onto a
  block. Figma's lines are 21, which no token has; the prompt box is
  now within tolerance (`section · SUGGESTED PROMPT` h +1 to -4). Together
  the layers below move up 5 to 9 px: `change history` y -18 to -23, `section · RUN IN` y -18 to -23, `button · Change` y -27.5 to -34.5, `section · MY NOTES` y -33 to -42, `notes field` y -31 to -40, and `task · next step` is 9 px shorter (h +66 to +57); `section · SOURCES` comes 9 px closer (y +122 to +113).
- **Disabled Reset.** Reset keeps its fill and `border.default` border
  while disabled, with only its label and icon in `fg.muted`, as Figma
  draws it (#105).
- **Discuss in the nav.** On the phone Discuss sits in the nav before
  Snooze and Dismiss, as Figma draws it (402:1945); it is the library
  `Button` at its default size, 32 high. Figma draws it in violet with a
  violet border; the library's button is the neutral secondary one.
  Library gap: Discuss toggle. It opens the discussion page (M18), with
  no tab bar; `InboxRoute.test.tsx` checks it on the phone.
- **Start.** Pinned above the tab bar, full width, as in M2 (`sticky
  action` passes); the bar is opaque.
  Start starts the task: its run card takes Start's place, and Reply
  here opens its chat (`InboxRoute.test.tsx`).
- **Change line.** On the phone the line "Changed in a discussion ·
  just now" with Undo sits under Read the whole prompt, 8 below it, as
  Figma draws it (402:2440); the tablet keeps it beside the link. The
  line's box takes the column's width in the `Stack`, where Figma's
  hugs its text (`change history` w +75); it starts lower by what the
  sections above add (`change history` y). Undo takes the change back.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
