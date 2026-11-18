# M09 deviations

What still differs from Figma M9 · Read the whole prompt (the prompt in a sheet over the phone's task page, `promptSheet`), after the last
fidelity run (`pnpm fidelity inbox M09`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (31 strings checked; 2 Figma strings under exceptions.json). Since the tab bar lies over the page (AppShell `tabBarOverlay`, library 1.0.0-beta.26), `f-005 the-bridge` (346:10770) passes, and its exception is gone.
- Position: 7 of 22 layers pass (`nav`, `task bar`, `title block`, `button · Change`, `sheet actions`, `button · Edit prompt`, `button · Copy`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · next step`: x +0, y +0, w +0, h +166.
- `section · WHY`: x +0, y +7, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +11, w +0, h -2.
- `section · RUN IN`: x +0, y +11, w +0, h -21.
- `section · MY NOTES`: noLayer, the frame has no layer "section · MY NOTES".
- `notes field`: noLayer, the frame has no layer "notes field".
- `section · SOURCES`: x +0, y +121, w +0, h +2.
- `sticky action`: x +0, y -54, w +0, h -23.
- `tab bar`: noLayer, the frame has no layer "tab bar".
- `346:10794`: x +0, y -10, w +0, h +11.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 8` (read with `use_figma`, M2 346:9246, M5 346:9866), so it ends 28 px under its last section. The build now pads the task the same way: 8 at the top, as before, and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). The padding makes `task · next step` 32 px taller (h +166); the other reasons for its height are below.
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
- **Nav and detail.** As in M02: the nav is 32 px high against Figma's
  40 (`nav` h -8); sections are 20 apart against Figma's 18 (d-072), the
  title is `title` (20/28) against Figma's 22 px and the prompt's lines
  are 20 px against 21, so each section starts a little lower (`title
  block` +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17,
  `section · RUN IN` +17). The Run in card
  puts Recommended beside the title (`section · RUN IN` h -21) and
  Change is 28 × 28 against 30 × 24 (`button · Change` w -2, h +4).
  As in M2, two Figma-matching changes moved the layers from the prompt
  down: the prompt's lines are now 20 px in `bodySm` on a block around
  the `Clamp` (the section is h -2, within tolerance, against h +3), so
  Run in, Change and Sources start 5 px higher; and the Recommended pill
  is 20 px as Figma's (`Badge size="sm"`, #106), so the card is 4 px
  shorter (h -17 before; the 24 px pill hid part of that offset) and
  Change 2 px higher. Reset is disabled and, as Figma draws it, keeps
  its fill and border with its label and icon in `fg.muted` (#105).
  Library gaps: Small text in the detail, 22 px title, Small icon
  button.
- **Under the sheet.** M9 draws M2's page with no tab bar, no My notes
  and Start at the very bottom (346:10779 at y 752, 92 high). The render
  keeps M2's page under the sheet: the tab bar, My notes and Start above
  the tab bar (`sticky action` y -54, h -23; `tab bar`, `section · MY
  NOTES` and `notes field` have no layer in M9). The sheet and its scrim
  cover all of them; the exceptions name the covered text. The task
  frame runs on to the end of the page (`task · next step` h +138) and
  Sources lies below the fold (`section · SOURCES` y +127); Figma keeps
  a hidden SOURCES section at y 623.
- **Prompt sheet.** `BottomSheet` titled Suggested prompt with Done,
  the whole prompt, the read-only hint, and Edit prompt and Copy
  (`sheet actions`, `button · Edit prompt` and `button · Copy` pass).
  Figma sets the prompt in Regular 15 with 23 px lines (346:10794, 253
  high); the render uses `bodyLg` (Regular 15/24, the 4 px grid value,
  d-100), so the text is 11 px taller and the sheet starts 10 px higher
  (`346:10794` y -10, h +11). Done shows the focus ring: the sheet
  focuses its first control. Library gap: Bottom sheet sections and
  data attribute.
- **What the buttons do.** Edit prompt closes the sheet and opens the
  prompt editor with the focus in it (M3); Copy copies the whole prompt
  (`InboxRoute.test.tsx`). A sent prompt's sheet (M10) has Copy only.
- **Sources under the sheet.** The checks render 806 px high (d-102).
  The source's detail lies under the prompt sheet in Figma and in the
  render (the exception says why).
- **Button labels.** Reset and Edit are `Button textSize="xs"`
  (`labelXs`, Medium 12/16), as Figma's Medium 12 (d-100). Change,
  Snooze and Dismiss are icons; the sheet's Edit prompt and Copy are
  `size="xl"` with `textSize="sm"` (Medium 13), as T8 sets them in Figma
  (346:7187, 346:7193; M9's text boxes 346:10802 and 346:10808 have the
  same size; library #109, beta.8), and the pinned Start is `size="xl"`
  with the default label. The labels
  match.
- **Prompt fade.** Behind the sheet the task's prompt is cut by height
  and fades with no ellipsis, as Figma's (#104, as M2).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `346:10794` x +0, y -10, w +0, h +11 (was x
  +0, y +54, w +0, h -53). The cause is the whole prompt in `bodyLg`
  (Regular 15/24, d-100; Figma 15/23; was `body`, 14/20).
- **Tabs under the sheet.** The frame draws no tab bar (see Under the
  sheet); the app keeps the page's tab bar under the sheet, so its tabs
  (`tab · Home`, `tab · Inbox`, `tab · Workspaces`, `tab · Projects` and
  `tab · More`) have no layer, as `tab bar`.
