# M10 deviations

What still differs from Figma M10 · Running, on the task page (`runningTaskPage`), after the last
fidelity run (`pnpm fidelity inbox M10`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (32 strings checked; 4 Figma strings under exceptions.json).
- Position: 4 of 11 layers pass (`task bar`, `running`, `running card`, `tab bar`).
- Rules: pass (3 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `nav`: x +0, y +0, w +0, h -8.
- `task · next step`: x +0, y +2, w +0, h +78.
- `title block`: x +0, y +6, w +0, h +5.
- `section · WHY`: x +0, y +13, w +0, h +2.
- `section · SUGGESTED PROMPT`: x +0, y +17, w +0, h -2.
- `section · MY NOTES`: x +0, y +17, w +0, h +7.
- `section · SOURCES`: x +0, y +31, w +0, h +2.

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
- **Nav and detail.** As in M02: the nav is 32 px high against Figma's
  40 (`nav` h -8); sections are 20 apart against Figma's 18 (d-072), the
  title is `title` (20/28) against Figma's 22 px and the prompt's lines
  are 20 px against 21, so each section starts a little lower (`title
  block` +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17,
  `section · MY NOTES` +17). The prompt's
  lines are now 20 px in `bodySm` on a block around the `Clamp` (as in
  M2): the sent prompt's section is h -2 (within tolerance; h +3
  before), so My notes and Sources start 5 px higher than before.
  Sources starts lower than Figma's (`section · SOURCES` y +31): Figma's
  SOURCES at y 623 runs under the run card's bar at y 631. Figma and the
  render both put 8 between the prompt's box and Read the whole prompt
  (346:11012 ends at y 483, 346:11015 starts at 491); the link sits
  lower only by the offsets above. Library gaps: Small text in the detail, 22 px title.
- **Task frame.** The task runs on under the run card's bar to the end
  of the page, so its box is taller than Figma's (`task · next step` h
  +78), and Sources shows at the bar's top edge as the page scrolls.
  The phone names the frame `task · next step`, as M10 does; the tablet
  keeps `task · running` (T4).
- **Run card.** The bar and the card pass (`running`, `running card`):
  on the phone the card is 12 in from the screen's edges (24 on the
  tablet), and its meta stays on one line, cut with an ellipsis, as
  Figma cuts it (the exception says why). The pills are 22 px against
  Figma's 20. Library gap: Pill height.
- **What the buttons do.** Reply here opens the started task's chat in
  the inbox (M8), with no tab bar; Back closes it and shows the list,
  whose row opens the task again (`InboxRoute.test.tsx`). Open in
  Workspaces is disabled (see below). Read the whole
  prompt opens the sent prompt in its sheet with Copy only, since a
  sent prompt cannot be edited.
- **Running row.** As the note says (and the T4 and D6 notes), a tap on
  the task under Running opens this page: the Running list (T6, M11)
  holds this page's task as its detail, and `InboxRoute.test.tsx` taps
  the row on the phone and finds the sent prompt and Reply here, not the
  chat. D5 still shows the chat beside the list, as Figma draws it.
- **Hidden Figma text.** Figma keeps Reset and Edit as hidden layers in
  the SENT PROMPT header (346:11006, 346:11011); the exceptions say why.
- **Button labels.** Button labels are 14 px (`label`) here;
  Figma sets small buttons in Medium 12 or 13, which no text style has
  (d-050). `Button textSize="sm"` (Medium 13, #105) serves only the
  labels Figma sets in Medium 13 (Newest, Filter and the dialog's Keep
  it on the desktop and tablet). Library gap: Button label size.
- **Prompt fade.** The sent prompt is cut by height and its last lines
  fade with no ellipsis, as Figma's (346:11014). Before #104,
  `Clamp fade` kept `line-clamp` and Chrome ended the last visible line
  with "…" ("…milestone named…"). The exception's selector now ends
  `div > div.clamp`, the block that carries the prompt's text style.
- **Run card padding.** Figma pads the run card 13 (346:11086 at x 12,
  its content at 25); `Panel` pads 16, so the kind mark, the meta line
  and Reply here sit 3 px further in. Library gap: Panel and text field
  padding.
- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and the
  title "Workspaces is not built yet", keeps the focus and does nothing on
  a press (`InboxRoute.test.tsx`); a disabled secondary `Button` keeps its
  fill and border and draws its label and icon in `fg.muted` (#105; before,
  the whole button faded), where Figma draws it enabled.
