# M08 deviations

What still differs from Figma M8 · Started, the chat stays in the inbox (the started task's chat, `chat`), after the last
fidelity run (`pnpm fidelity inbox M08`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (15 strings checked).
- Position: 0 of 6 layers pass (none).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -10; 38 px removed: y +0.
- `button · Open in Workspaces`: x -7, y -42, w +7, h -2; 38 px removed: y -4.
- `started task`: x +0, y -40, w +0, h +6; 38 px removed: y -2.
- `chevron · open task`: x -4, y -37, w +0, h +0; 38 px removed: y +1.
- `running in`: x +4, y -36, w -8, h +0; 38 px removed: y +2.
- `346:10886`: x +0, y -6, w +0, h +3; anchored to the bottom, no status bar offset.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is 38 px higher (`y -38`). The position check measures from the
  frame's top, so no phone frame can pass it; the offsets above give
  the rest as "38 px removed". The open request
  `projects/ncc-1701/inbox/fidelity-status-bar-offset.md` in Erik's
  brain asks how to measure it (it names the phone frames too).
  Library gap: Top and bottom safe areas on the phone.
- **Chat header.** As in T5: Back with Workspaces is `BackRow` (28 px)
  against Figma's 38 px row (`nav` h -10), so the header starts 2 px
  higher (`started task` y -2 with the status bar removed). The header
  `Panel` pads 16 against Figma's 13, so the chevron is 4 px left
  (`chevron · open task` x -4) and the chat line 4 px right (`running
  in` x +4, w -8); the box is 6 px taller (`started task` h +6).
  Workspaces is wider because of its 14 px label (`button · Open in
  Workspaces` x -7, w +7). Library gaps: Chat header on the tablet,
  Button label size.
- **Title.** The title stays on one line and ends with an ellipsis when
  it does not fit, as the note says (`TruncatedText`). Figma's is 14 px
  SemiBold; the phone draws it in `label` (Medium 14), since
  `paneTitle` (15) cuts it. Library gap: Title of the started task on
  the phone.
- **Reply box.** `AppShell` keeps the home-indicator area under the
  reply box on the phone, so the box sits 6 px higher than Figma's and
  3 px taller (`346:10886` y -6, h +3). It is not focused: Figma draws a
  caret and a lighter border (library gap: Composer focus).
