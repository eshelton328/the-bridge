# M17 deviations

What still differs from Figma M17 · Discuss, on the task page (`discussTask`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (34 strings checked; 2 Figma strings under exceptions.json).
- Position: 11 of 18 layers pass (`nav`, `task bar`, `title block`, `button · Change`, `sticky action`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · next step`: x +0, y +0, w +0, h +87.
- `section · WHY`: x +0, y +7, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +11, w +0, h -2.
- `section · RUN IN`: x +0, y +11, w +0, h -21.
- `section · MY NOTES`: x +0, y -8, w +0, h +7.
- `notes field`: x +0, y -6, w +0, h +5.
- `section · SOURCES`: x +0, y +121, w +0, h +2.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 8` (read with `use_figma`, M2 346:9246, M5 346:9866), so it ends 28 px under its last section. The build now pads the task the same way: 8 at the top, as before, and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). The padding makes `task · next step` 32 px taller (h +87); the other reasons for its height are below.
- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Waiting for a design: Device chrome (d-089).
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
  now within tolerance (`section · SUGGESTED PROMPT` h +3 to -2). Together
  the layers below move up 5 to 9 px, which leaves `section · RUN IN`
  y +17, `button · Change` y +5.5, `section · MY NOTES` y -2 and
  `notes field` y +0; `task · next step` is 9 px shorter (h +68 to
  +59), and `section · SOURCES` comes 9 px closer (y +127).
- **Disabled Reset.** Reset keeps its fill and `border.default` border
  while disabled, with only its label and icon in `fg.muted`, as Figma
  draws it (#105).
- **Discuss in the nav.** On the phone Discuss sits in the nav before
  Snooze and Dismiss, as Figma draws it (402:1945); it is the library
  `Button` at its default size, 32 high. Figma draws it in violet with a
  violet border; the library's button is the neutral secondary one.
  Library gap: Discuss toggle. It opens the discussion page (M18), with
  no tab bar; the Inbox route tests check it on the phone.
- **Start.** Pinned above the tab bar, full width, as in M2 (`sticky
  action` passes); the bar is opaque.
  Start starts the task: its run card takes Start's place, and Reply
  here opens its chat (the Inbox route tests).
- **Hidden Sources.** The checks render 806 px high (d-102). Figma keeps
  a SOURCES section at y 623 that it does not draw (frame.png shows Run
  in and My notes there); the render keeps Sources below My notes, under
  the pinned Start (the exception says why).
- **Button labels.** Discuss in the nav, Reset and Edit are `Button
  textSize="xs"` (`labelXs`, Medium 12/16), as Figma's Medium 12
  (d-100). Change, Snooze and Dismiss are icons, and the pinned Start
  is `size="xl"` with the default label. The labels match.

## Reference faults

- **SOURCES (402:1882).** `frame.json` has the text layer "SOURCES" at
  16,623 (49×14), in `section · SOURCES` (402:1880) at 16,623, 358×62.
  That box is inside the Run in card (`run in`, 402:1863, 16,561 to 646).
  `frame.png` draws the card there and no "SOURCES" label: MY NOTES
  comes next under the card. The metadata and the picture of the same
  frame do not agree, so the covered-text check (the-bridge #34) reports
  this layer as covered, which Figma never shows. The build is not changed
  for it, and the saved reference stays as it is: only a new
  `get_metadata` and `get_screenshot` of the frame can correct it
  (references/AGENTS.md). Found in step 12 of the fidelity loop
  (2026-11-17).
