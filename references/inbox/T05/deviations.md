# T05 deviations

What still differs from Figma T5 · Started, the chat stays in the inbox (the started task's chat, `chat`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no T5 layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 0 of 6 layers pass.
- Rules: pass.

## Failing layers

Render minus Figma, in px. The position check renders the page 29 px
shorter, below Figma's status bar, and adds 29 to each render y (d-101).

- `nav`: x +2, y +8, w -4, h -10.
- `button · Open in Workspaces`: x -8.8, y +4, w +6.8, h -2.
- `started task`: x +2, y +6, w -4, h +6.
- `chevron · open task`: x -6, y +9, w +0, h +0.
- `running in`: x +6, y +10, w -12, h +0.
- `346:6416`: x +2, y +20, w -4, h +3.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 29 px shorter and adds
  29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Chat header.** Back with Workspaces is `BackRow` (28 px) with a
  small button, against Figma's 38 px row 4 px under the status bar
  (`nav` y +8, h -10). The header `Panel` pads 16 against Figma's 12,
  so the chevron is 6 px left (`chevron · open task` x -6) and the chat line
  6 px right (`running in` x +6, w -12). Workspaces is wider because of
  its 14 px label (`button · Open in Workspaces` x -8.8, w +6.8).
  Library gaps: Chat header on the tablet, Button label size.
- **Reply box.** Figma leaves a 21 px home-indicator area under the
  reply box; `AppShell` keeps it only on the phone, so the reply box
  sits 20 px lower (`346:6416` y +20). The story focuses the reply box,
  as Figma draws it with a caret; the focused border is cyan, not
  Figma's lighter grey (library gaps: Top and bottom safe areas on the
  tablet, Composer focus).
- **Messages.** Messages are `body` (14/20) against Figma's 13/19, so
  Claude's reply wraps three words earlier. Library gap: Message author
  icon and small text.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- No caret in the focused reply box: stays. The story's play test
  focuses the reply box, and it still has the focus when the page is
  captured (`document.activeElement` is the reply box). Playwright's
  screenshot hides the text caret by default, so no render shows it.
- Claude's reply wraps three words earlier ("or wait for" moves down):
  stays. `Message` draws its text in `body` (14/20) against Figma's
  13/19 (library gap: Message author icon and small text).
- Copy under the reply 72 × 28 with a 14 px label against 62 × 20 and
  11 px; Stop 69 × 30 and send 28 against 59 × 26 and 24: stays. The
  library's `Button size="sm"` and `Composer` controls are 28 px high
  with 14 px labels (library gap: Button label size).
- 17 px from the task card to the first message against 23: fixed. The
  chat starts 24 below the card (Figma 22, 24 on the grid, d-072).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and the
  title "Workspaces is not built yet", keeps the focus and does nothing on
  a press (`InboxRoute.test.tsx`). Since beta.5 (#105) a disabled
  `secondary` Button keeps its fill and border and draws its label and
  icon in `fg.muted`, where Figma draws it enabled with a brighter
  label.
