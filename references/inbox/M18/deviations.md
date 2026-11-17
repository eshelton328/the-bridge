# M18 deviations

What still differs from Figma M18 · Discussion, before the first message (`discussionPage`), after the last
fidelity run (`pnpm fidelity inbox M18`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (18 strings checked, 2 excepted in `exceptions.json`).
- Position: 0 of 10 layers pass.
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px; "38 px removed" is the y offset without the
status bar.

- `nav`: x +0, y -38, w +0, h -1; 38 px removed: y +0.
- `task · discussing`: x +0, y -31, w +0, h +12; 38 px removed: y +7.
- `chevron · open task`: x -4, y -28, w +0, h +0; 38 px removed: y +10.
- `model and context`: x +4, y -27, w +9.6, h +4; 38 px removed: y +11.
- `guard`: x +4, y -24, w -8, h +3; 38 px removed: y +14.
- `discussion`: x +0, y -3, w +0, h -104; 38 px removed: y +35.
- `empty state`: x +0, y -17, w +0, h +235; 38 px removed: y +21.
- `it can`: x +0, y -48, w +0, h +2; 38 px removed: y -10.
- `suggestions`: x +0, y -48, w +0, h +2; 38 px removed: y -10.
- `composer · discussion`: x +0, y -6, w +0, h +3; anchored to the bottom, no status bar offset.

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
- **Discussion page header.** As on the tablet (T17), but the phone
  puts the model and context in the task card, under the task's place,
  as Figma draws them (`model and context` 454:216), and the nav keeps
  only Back ("Task") and the Discussion pill. `BackRow` is 28 px high
  against Figma's 29 (`nav` h -1). The model chip's own padding makes
  the group about 10 px wider and 4 px taller (`model and context` w,
  h). Library gap: Chat header on the tablet.
- **Task card.** A `Panel` with the title, cut on one line with an
  ellipsis as Figma cuts it (TruncatedText; the exception says why the
  cut title passes), the Next step pill, a chevron, the place, the model
  and context and the guard. The `Panel` pads 16 against Figma's 12 and
  its rows are 4 apart against Figma's 5, so the card is 12 px taller
  (`task · discussing` h +12), the chevron 4 px left (`chevron · open
  task` x -4) and the guard 4 px right (`guard` x +4, w -8). Every
  entry under the card starts lower by what the card adds. Library gap:
  Chat header on the tablet.
- **Reply box.** The reply box sits above the home indicator, as Figma
  draws it (`composer · discussion` within 6 px). The story focuses the
  composer, as Figma draws it with a caret; the focused border is cyan,
  not Figma's lighter grey (Library gap: Composer focus). Its attach
  and send buttons do nothing yet, as on D14 to T23: nothing answers a
  discussion message in this mock-up.
- **Context meter value.** `exceptions.json` excepts the meter's
  percentage: `ContextMeter` draws the number and the % sign as two text
  nodes, so the text check cannot match the whole string; the meter
  shows it, as in T17.
- **Empty state.** As in T17: the icon tile is a round raised surface
  (Library gap: Empty state with an icon tile). The empty state holds
  the It can panel and the suggestions, so its box is taller than
  Figma's (`empty state` h). The empty state's top sits higher than
  Figma centres it, so the panel and the suggestions start 10 px higher
  than Figma's once the status bar is removed (`it can`, `suggestions`
  y).
- **Suggestions.** On the phone they stack under "Try", full width,
  their labels at the start, as Figma draws them (402:2075); the label
  is `eyebrow` in `fg.subtle`. A suggestion puts its question in the
  reply box (`InboxRoute.test.tsx`); Figma draws no state after the
  press, and nothing sends it.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.
