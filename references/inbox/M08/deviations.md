# M08 deviations

What still differs from Figma M8 · Started, the chat stays in the inbox (the started task's chat, `chat`), after the last
fidelity run (`pnpm fidelity inbox M08`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108; updated again on 2026-11-17
from `pnpm fidelity inbox` of all 70 frames with library 1.0.0-beta.8, #109), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (15 strings checked).
- Position: 1 of 6 layers pass (`chevron · open task`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `nav`: x +0, y +0, w +0, h -10.
- `button · Open in Workspaces`: x +4.8, y -4, w -4.7, h -2.
- `started task`: x +0, y -2, w +0, h +6.
- `running in`: x +4, y +2, w -8, h +0.
- `346:10886`: x +0, y -6, w +0, h +3.

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
- **Chat header.** As in T5: Back with Workspaces is `BackRow` (28 px)
  against Figma's 38 px row (`nav` h -10), so the header starts 2 px
  higher (`started task` y -2). The header `Panel` pads 16 against
  Figma's 13, so the chevron is 4 px left (`chevron · open task` x -4,
  within the tolerance) and the chat line 4 px right (`running
  in` x +4, w -8); the box is 6 px taller (`started task` h +6).
  Workspaces is `textSize="xs"` (Medium 12/16), Figma's Medium 12
  (346:10847, read from Figma; library #109, beta.8). The button is
  `size="sm"`: 28 px high against Figma's 30 and about 5 px narrower,
  because `sm` pads its label less than Figma's 112 px button does
  (`button · Open in Workspaces` x +4.8, w -4.7, h -2; was x -6.8,
  w +6.8 with the 14 px `label`). Library gap: Chat header on the
  tablet.
- **Title.** The title shows whole on one line, as Figma draws it, and
  a longer one ends with an ellipsis, as the note says (`TruncatedText`).
  The header's `Panel` pads 16 against Figma's 13, so its row is 8 px
  narrower; the title, the pill and the chevron are 6 apart against
  Figma's 8, which gives the title the room it needs. Figma's title is
  14 px SemiBold; the phone draws it in `label` (Medium 14), since
  `paneTitle` (15) cuts it. Library gaps: Title of the started task on
  the phone, Chat header on the tablet.
- **Chat.** The entries are 12 apart, as in Figma (346:10863 to
  346:10884). Copy under the reply is `Button size="xs" textSize="xs"`:
  24 px high against Figma's 22 (the 4 px grid value, d-100) and
  Medium 12 against Figma's 11 px label, since no label style is 11.
  Stop and send are larger than Figma's because of `Composer`'s 14 px
  label and sizes. Library gap: Button label size.
- **Reply box.** `AppShell` keeps the home-indicator area under the
  reply box on the phone, so the box sits 6 px higher than Figma's and
  3 px taller (`346:10886` y -6, h +3). It is not focused: Figma draws a
  caret and a lighter border (library gap: Composer focus).
- **Workspaces.** The nav's Workspaces button (`button · Open in
  Workspaces`) is disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and the
  title "Workspaces is not built yet", keeps the focus and does nothing on
  a press (`InboxRoute.test.tsx`); a disabled secondary `Button` keeps its
  fill and border and draws its label and icon in `fg.muted` (#105; before,
  the whole button faded), where Figma draws it enabled.
