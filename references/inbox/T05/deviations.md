# T05 deviations

What still differs from Figma T5 · Started, the chat stays in the inbox (the started task's chat, `chat`), after the last
fidelity run (`pnpm fidelity inbox T05`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 0 of 6 layers pass.
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav`: x +2, y -21, w -4, h -10; 29 px removed: y +8.
- `button · Open in Workspaces`: x -8.8, y -25, w +6.8, h -2; 29 px removed: y +4.
- `started task`: x +2, y -23, w -4, h +6; 29 px removed: y +6.
- `chevron · open task`: x -6, y -20, w +0, h +0; 29 px removed: y +9.
- `running in`: x +6, y -19, w -12, h +0; 29 px removed: y +10.
- `346:6416`: x +2, y +20, w -4, h +3; anchored to the bottom, no status bar offset.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets below give the rest as "29 px removed". Library gap: Top and
  bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Chat header.** Back with Workspaces is `BackRow` (28 px) with a
  small button, against Figma's 38 px row 4 px under the status bar
  (`nav` h -10, 8 px lower than Figma's after the status bar is
  removed). The header `Panel` pads 16 against Figma's 12, so the
  chevron is 6 px left (`chevron · open task` x -6) and the chat line
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
  a press (`InboxRoute.test.tsx`); `Button`'s disabled style fades it,
  where Figma draws it enabled.
