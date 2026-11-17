# M02 deviations

What still differs from Figma M2 · A next step (the next step on the phone's task page, `taskPage`), after the last
fidelity run (`pnpm fidelity inbox M02`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (32 strings checked; 3 Figma strings under exceptions.json).
- Position: 3 of 13 layers pass (`task bar`, `sticky action`, `tab bar`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. The position check renders the page 38 px
shorter, below Figma's status bar, and adds 38 to each render y (d-101).

- `nav`: x +0, y +0, w +0, h -8.
- `task · next step`: x +0, y +2, w +0, h +59.
- `title block`: x +0, y +6, w +0, h +5.
- `section · WHY`: x +0, y +13, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +17, w +0, h -2.
- `section · RUN IN`: x +0, y +17, w +0, h -21.
- `button · Change`: x +0, y +5.5, w -2, h +4.
- `section · MY NOTES`: x +0, y -2, w +0, h +7.
- `notes field`: x +0, y +0, w +0, h +5.
- `section · SOURCES`: x +0, y +127, w +0, h +2.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 38 px shorter and adds
  38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **Nav.** `BackRow` with Snooze and Dismiss as 32 px icon buttons is
  32 px high against Figma's 40 (`nav` h -8); 12 below it the task
  starts 2 px lower than Figma's (`task · next step` y +2).
- **Detail spacing.** Figma sets the phone's sections 18 apart; the
  render sets them 20 (d-072: 18 is as far from 16 as from 20, and a
  tie takes the larger token). The title is `title` (20/28) against
  Figma's 22 px and the prompt's lines are 20 px against 21, so each
  section starts a little lower than the one above it (`title block`
  +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17). Library
  gaps: Small text in the detail, 22 px title.
- **Run in card.** The render puts the Recommended pill beside the
  title, as on the desktop and tablet; Figma's phone card puts it on its
  own line under the detail (346:9316), so the card is 21 px shorter
  (`section · RUN IN` h -21) and Change sits 11.5 px higher in it
  (`button · Change` y +5.5 against the card's +17). Change is
  `Button size="sm" iconOnly`, 28 × 28 against Figma's 30 × 24
  (`button · Change` w -2, h +4). Library gap: Small icon button.
  The pill is now 20 px high, as Figma's (`Badge size="sm"`, #106); at
  24 px its extra 4 px hid part of the card's offset, so the card went
  from h -17 to h -21, and Change moved 2 px up with the shorter title
  row. The card, Change and everything below it also start 5 px higher
  than before, because the prompt above is 5 px shorter (see Prompt).
- **Reset.** Reset is disabled until the prompt differs from the
  suggestion. As Figma draws it, it keeps its fill and `border.default`
  border and only its label and icon are `fg.muted` (#105: a disabled
  secondary `Button` no longer fades).
- **Prompt.** `Clamp lines={5} fade` cuts the prompt by height after
  five lines and fades its end with no ellipsis (#104), as Figma cuts
  the text box at 128 px under a fade (346:9300). The prompt's text
  style (`bodySm`) now sits on a block around the `Clamp`: on the
  inline span it had, the 13 px text in the panel's 14 px line made
  21 px lines, and the cut at five 20 px lines hid part of the fifth.
  The lines are now 20 px against Figma's 21 (no token has 21), so the
  prompt section is 5 px shorter (`section · SUGGESTED PROMPT` h -2,
  within tolerance; it was h +3) and every layer below it starts 5 px
  higher than before. The `hiddenOverflow` exception says why the cut
  text passes; its selector now ends `div > div.clamp` for that block.
- **Start.** Pinned above the tab bar, full width, as Figma draws it
  (`sticky action` passes); the hint "Opens the new chat and sends the
  prompt." is left out, as Figma does. The button is `size="xl"`. The
  bar is opaque, as Figma's: the chrome over the canvas, so the page
  that scrolls under it does not show through.
  Start starts the task: its run card takes Start's place, and Reply
  here opens its chat (`InboxRoute.test.tsx`).
- **My notes and Sources.** The page scrolls under Start, as the note
  says. My notes starts lower than Figma's by what the sections above
  add, less the 21 px the Run in card saves (`section · MY NOTES` y -2,
  `notes field` y +0; 9 px higher than before from the shorter prompt
  and pill). Figma
  keeps a hidden SOURCES section at y 623 (346:9326); the render has
  Sources after My notes, below the fold (`section · SOURCES` y +127).
- **Task frame.** The task runs on under Start to the end of the page,
  so its box is taller than Figma's (`task · next step` h +59).
- **Button labels.** Button labels are 14 px (`label`) here;
  Figma sets small buttons in Medium 12 or 13, which no text style has
  (d-050). `Button textSize="sm"` (Medium 13, #105) serves only the
  labels Figma sets in Medium 13 (Newest, Filter and the dialog's Keep
  it on the desktop and tablet). Library gap: Button label size.
