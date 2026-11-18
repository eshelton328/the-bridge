# M04 deviations

What still differs from Figma M4 · Choose where it runs (M2's task page with the Run in sheet, `runInSheet`), after the last
fidelity run (`pnpm fidelity inbox M04`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (47 strings checked; 1 Figma string under exceptions.json). Since the tab bar lies over the page (AppShell `tabBarOverlay`, library 1.0.0-beta.26), both `f-005 the-bridge` layers (346:9663, 346:9725) pass, and their exception is gone.
- Position: 3 of 19 layers pass (`nav`, `task bar`, `title block`).
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · next step`: x +0, y -2, w +0, h +185.
- `section · WHY`: x +0, y +5, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +9, w +0, h +17.
- `section · RUN IN`: x +0, y +28, w +0, h -21.
- `button · Change`: x +0, y +16.5, w -2, h +4.
- `section · MY NOTES`: noLayer, the frame has no layer "section · MY NOTES".
- `notes field`: noLayer, the frame has no layer "notes field".
- `section · SOURCES`: x +0, y +119, w +0, h +2.
- `sticky action`: x +0, y -54, w +0, h -23.
- `tab bar`: noLayer, the frame has no layer "tab bar".
- `run in picker`: x +0, y -27, w +0, h +27.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 8` (read with `use_figma`, M2 346:9246, M5 346:9866), so it ends 28 px under its last section. The build now pads the task the same way: 8 at the top, as before, and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). The padding makes `task · next step` 32 px taller (h +185); the other reasons for its height are below.
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
- **Nav.** `BackRow` with Snooze and Dismiss as 32 px icon buttons is
  32 px high against Figma's 40 (`nav` h -8); 12 below it the task
  starts where Figma's does (`task · next step` y +0).
- **Detail spacing.** As in M2: sections are 20 px apart against
  Figma's 18 (d-072: a tie takes the larger token), the title is
  `title` (20/28) against Figma's 22 px and the prompt's lines are 20
  px against 21, so each section starts a little lower than the one
  above it (`title block` +4, `section · WHY` +11, `section · SUGGESTED
  PROMPT` +15). Figma's M4 prompt has no Read the whole prompt under it
  (346:9682 is 169 high); the render keeps M2's link, so the section is
  taller (`section · SUGGESTED PROMPT` h +17) and Run in starts lower
  (`section · RUN IN` y +34, `button · Change` y +22.5). The prompt's
  lines are now 20 px, in `bodySm` on a block around the `Clamp` (as in
  M2), so the section is 5 px shorter than before (h +22 then) and Run
  in, Change and Sources start 5 px higher. Library gaps: Small text in
  the detail, 22 px title.
- **Run in card.** The render puts the Recommended pill beside the
  title, as on the desktop and tablet; Figma's phone card puts it on its
  own line under the detail (346:9709 in M4), so the card is 21 px
  shorter (`section · RUN IN` h -21). Change is
  `Button size="sm" iconOnly`, 28 × 28 against Figma's 30 × 24
  (`button · Change` w -2, h +4). Library gap: Small icon button.
  The pill is now 20 px high, as Figma's (`Badge size="sm"`, #106); at
  24 px its extra 4 px hid part of the card's offset (h -17 before),
  and Change moved 2 px up with the shorter title row.
- **Prompt.** `Clamp lines={5} fade` cuts the prompt by height after
  five lines and fades its end with no ellipsis (#104), as Figma cuts
  the text box at 128 px under a fade (346:9300). The exception says
  why the cut text passes; its selector now ends `div > div.clamp`,
  the block that carries the prompt's text style (see M2).
- **Under the sheet.** M4 draws M2's page with no tab bar, no My notes
  and Start at the very bottom (346:9736 at y 752, 92 high). The render
  keeps M2's page under the sheet: the tab bar, My notes and Start above
  the tab bar (`sticky action` y -54, h -23; `tab bar`, `section · MY
  NOTES` and `notes field` have no layer in M4). The sheet covers all of
  them; the exceptions name the covered text. The task frame runs on to
  the end of the page (`task · next step` h +157) and Sources lies below
  the fold (`section · SOURCES`).
- **Run in sheet.** `BottomSheet` titled Run in with Done, the picker's
  search, sections and note. The search field's text and placeholder
  are 13 px (`SearchField textSize="sm"`, #106), as Figma's, and the
  Recommended pill is 20 px (`Badge size="sm"`), as Figma's. The rows
  and the section labels (`GroupHeader`, 36 px since library #108,
  against Figma's 28) are still taller than Figma's, so the picker is
  27 px taller (`run in picker` h +27; +33 before #108, +37 before the
  20 px pills) and the sheet starts higher (y -27).
  Done shows the focus ring: the sheet focuses its first control.
  Figma sets the note "Shells are not listed…" on a panel one step
  lighter than the sheet (346:9822, #101727 on #0f1526); no surface
  token is that close, so the note has none. Library gap: Picker note
  panel on the phone.
  Library gap: Bottom sheet sections and data attribute.
- **Button labels.** Reset and Edit are `Button textSize="xs"`
  (`labelXs`, Medium 12/16), as Figma's Medium 12 (d-100). Change,
  Snooze and Dismiss are icons, and the pinned Start is `size="xl"` with
  the default label. The labels match.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `run in picker` x +0, y -27, w +0, h +27
  (was x +0, y -33, w +0, h +33). The cause is #108's list
  `GroupHeader` (36 px, was 38): the sheet's three section labels
  (`MenuSection`) are 2 px shorter each. The choices are `OptionList`
  rows, which #108 did not change.
- **Tabs under the sheet.** The frame draws no tab bar (see Under the
  sheet); the app keeps the page's tab bar under the sheet, so its tabs
  (`tab · Home`, `tab · Inbox`, `tab · Workspaces`, `tab · Projects` and
  `tab · More`) have no layer, as `tab bar`.
