# M05 deviations

What still differs from Figma M5 · A question that blocks a chat (the question on the phone, `questionPhone`), after the last
fidelity run (`pnpm fidelity inbox M05`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (28 strings checked; 2 Figma strings under exceptions.json).
- Position: 4 of 10 layers pass (`task · question`, `task bar`, `sticky action`, `tab bar`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `nav`: x +0, y +0, w +0, h -8.
- `title block`: x +0, y +6, w +0, h +6.
- `blocking`: x +0, y +14, w +0, h +9.
- `section · CONTEXT`: x +0, y +25, w +0, h +2.
- `section · CHOOSE ONE`: x +0, y +29, w +0, h +3.
- `section · NOTE TO THE CHAT · OPTIONAL`: x +0, y +34, w +0, h +0.

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
- **Nav.** As in M2: the nav is 32 px against 40 (`nav` h -8), and the
  task starts 2 px lower, within the tolerance (`task · question` and
  `task bar` pass).
- **Title.** Panda's preflight balanced the lines of every heading
  (`text-wrap: balance`), which broke the title after "or" with half
  the first line empty. The title now fills each line before it wraps,
  as Figma does. At `title` (20/28) against Figma's 22 px, "the" still
  fits on the first line, where Figma breaks before it (`title block`
  y +6, h +6). Library gap: 22 px title.
- **Detail spacing.** Sections are 20 px apart against Figma's 18
  (d-072: a tie takes the larger token), so each section starts a
  little lower (`blocking` +14, `section · CONTEXT` +25, `section ·
  CHOOSE ONE` +29). Library gap: Small text in the detail.
- **Waiting box.** `Panel tone="needsYou"` pads 16 against Figma's 13,
  so the box is 9 px taller (`blocking` h +9). Its title is `label`
  (14 px). Its tint is 0.08, as Figma's (library #107); its border
  stays `status.needsYou.border` at 0.5 against Figma's 0.35, because
  0.35 gives 2.0:1 against the tint, under WCAG AA's 3:1 (d-100). The
  button says Open on the phone, Open chat on the desktop and tablet,
  as Figma does. Library gap: Panel and text field padding.
- **Options.** The Recommended pill is 20 px high, as Figma's
  (`Badge size="sm"`, #106), so the option cards are within 3 px of
  Figma's (`section · CHOOSE ONE` h +3; h +7 with the 24 px pill).
- **Answer.** Pinned above the tab bar, full width, without its hint,
  as Figma draws it (`sticky action` passes). The bar is opaque, as
  Figma's: the chrome over the canvas, so the options and the note that
  scroll under it do not show through. The note to the chat lies under
  it, 34 px lower than Figma's from the sections above (`section · NOTE
  TO THE CHAT · OPTIONAL` y +34); the page scrolls to it.
- **Note under Answer.** The checks render 806 px high (d-102). The
  note's label lies under the pinned Answer in Figma and in the render
  (the exception says why).
- **Button labels.** Open in the waiting box is `Button
  textSize="xs"` (`labelXs`, Medium 12/16), as Figma's Medium 12
  (d-100). Snooze and Dismiss are icons, and the pinned Answer is
  `size="xl"` with the default label. The labels match.
