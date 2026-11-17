# M20 deviations

What still differs from Figma M20 · The task after Apply (`changeAppliedPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.5, which adds #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (35 strings checked; 3 Figma strings under exceptions.json).
- Position: 4 of 14 layers pass (`task bar`, `button · Change`, `sticky action`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `nav`: x +0, y +0, w +0, h -8.
- `task · next step`: x +0, y +2, w +0, h +57.
- `title block`: x +0, y +6, w +0, h +5.
- `section · WHY`: x +0, y +13, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +17, w +0, h -4.
- `change history`: x +0, y +15, w +75, h -2.
- `section · RUN IN`: x +0, y +15, w +0, h -21.
- `section · MY NOTES`: x +0, y -4, w +0, h +7.
- `notes field`: x +0, y -2, w +0, h +5.
- `section · SOURCES`: x +0, y +151, w +0, h +2.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
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
  the layers below move up 5 to 9 px, which leaves `change history` and
  `section · RUN IN` y +15, `button · Change` within tolerance,
  `section · MY NOTES` y -4 and `notes field` y -2; `task · next step`
  is 9 px shorter (h +66 to +57), and `section · SOURCES` comes 9 px
  closer (y +151).
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
- **Hidden Sources.** The checks render 806 px high (d-102). Figma keeps
  a SOURCES section at y 623 that it does not draw (frame.png shows Run
  in there); the render keeps Sources below My notes, under the pinned
  Start (the exceptions say why).
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
