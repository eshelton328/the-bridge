# M10 deviations

What still differs from Figma M10 · Running, on the task page (`runningTaskPage`), after the last
fidelity run (`pnpm fidelity inbox M10`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (32 strings checked; 4 Figma strings under exceptions.json).
- Position: 4 of 11 layers pass (`section · SOURCES`, `running`, `running card`, `tab bar`).
- Rules: pass (3 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -8; 38 px removed: y +0.
- `task · next step`: x +0, y -36, w +0, h +83; 38 px removed: y +2.
- `task bar`: x +0, y -36, w +0, h +2; 38 px removed: y +2.
- `title block`: x +0, y -32, w +0, h +5; 38 px removed: y +6.
- `section · WHY`: x +0, y -25, w +0, h +2; 38 px removed: y +13.
- `section · SUGGESTED PROMPT`: x +0, y -21, w +0, h +3; 38 px removed: y +17.
- `section · MY NOTES`: x +0, y -16, w +0, h +7; 38 px removed: y +22.

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
- **Nav and detail.** As in M02: the nav is 32 px high against Figma's
  40 (`nav` h -8); sections are 20 apart against Figma's 18 (d-072), the
  title is `title` (20/28) against Figma's 22 px and the prompt's lines
  are 20 px against 21, so each section starts a little lower (`title
  block` +6, `section · WHY` +13, `section · SUGGESTED PROMPT` +17,
  `section · MY NOTES` +22 with the status bar removed). Figma and the
  render both put 8 between the prompt's box and Read the whole prompt
  (346:11012 ends at y 483, 346:11015 starts at 491); the link sits
  lower only by the offsets above. Library gaps: Small text in the detail, 22 px title.
- **Task frame.** The task runs on under the run card's bar to the end
  of the page, so its box is taller than Figma's (`task · next step` h
  +83), and Sources shows at the bar's top edge as the page scrolls.
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
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13. Library gap: Button label
  size.
- **Prompt fade.** Figma fades the sent prompt's last lines with no
  ellipsis (346:11014); `Clamp fade` keeps `line-clamp`, so Chrome also
  ends the last visible line with "…" ("…milestone named…"). Library
  gap: Prompt fade without an ellipsis.
- **Run card padding.** Figma pads the run card 13 (346:11086 at x 12,
  its content at 25); `Panel` pads 16, so the kind mark, the meta line
  and Reply here sit 3 px further in. Library gap: Panel and text field
  padding.
- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and the
  title "Workspaces is not built yet", keeps the focus and does nothing on
  a press (`InboxRoute.test.tsx`); `Button`'s disabled style fades it,
  where Figma draws it enabled.
