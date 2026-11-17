# M18 deviations

What still differs from Figma M18 · Discussion, before the first message (`discussionPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (18 strings checked, 2 excepted in `exceptions.json`).
- Position: 2 of 10 layers pass (`nav`, `chevron · open task`).
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · discussing`: x +0, y -1, w +0, h +12.
- `model and context`: x +4, y +3, w +9.6, h +4.
- `guard`: x +4, y +6, w -8, h +3.
- `discussion`: x +0, y +27, w +0, h -126.
- `empty state`: x +0, y +13, w +0, h +235.
- `it can`: x +0, y -18, w +0, h +2.
- `suggestions`: x +0, y -18, w +0, h +2.
- `composer · discussion`: x +0, y -6, w +0, h +3.

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
- **Discussion page header.** As on the tablet (T17), but the phone
  puts the model and context in the task card, under the task's place,
  as Figma draws them (`model and context` 454:216), and the nav keeps
  only Back ("Task") and the Discussion pill. `BackRow` is 28 px high
  against Figma's 29 (`nav` h -1). The model chip's own padding makes
  the group about 10 px wider and 4 px taller (`model and context` w,
  h). Library gap: Chat header on the tablet.
- **Task card under the nav.** The card sits 8 under the nav, as
  Figma draws it (was 16), so it is within 1 px of Figma
  (`task · discussing` y -1). Every layer under it moved up 8 too.
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
  not Figma's lighter grey (Library gap: Composer focus). Send adds
  Erik's message to the discussion and empties the box
  (`InboxRoute.test.tsx`); nothing answers it in this mock-up. The box
  has no attach button, where Figma draws a clip at its start: no file
  flow is designed, and `Composer` cannot draw its attach button
  disabled (LIBRARY_GAPS.md, Waiting for a design). Figma's caret
  blinks, so a still picture may show it or not; no change.
- **Context meter value.** `exceptions.json` excepts the meter's
  percentage: `ContextMeter` draws the number and the % sign as two text
  nodes, so the text check cannot match the whole string; the meter
  shows it, as in T17.
- **Empty state.** As in T17: the icon tile is a round raised surface
  (Library gap: Empty state with an icon tile). The empty state holds
  the It can panel and the suggestions, so its box is taller than
  Figma's (`empty state` h). The empty state's top sits higher than
  Figma centres it, so the panel and the suggestions start 18 px higher
  than Figma's (`it can`, `suggestions` y -18).
- **Empty state text and icons.** On the phone the text is at most
  320 wide, as Figma's (402:2060), so its lines break where Figma's do
  ("When / you ask…", "…proposal. / Nothing changes…"). No token names a
  text column's width; `shell.popover` has the same 320 (Library gap:
  Empty state with an icon tile). The It can icons are violet
  (`accent.discuss`, #9e8fff), as Figma draws all three (402:2064 to
  402:2072), on D14 and T17 too.
- **Placeholder.** "Ask about this task" is `body` 14 in `Composer`;
  Figma's is 13 (402:2087), about 1 px larger in the picture. Library
  gap: Composer focus.
- **Suggestions.** On the phone they stack under "Try", full width,
  their labels at the start, as Figma draws them (402:2075); the label
  is `eyebrow` in `fg.subtle`. A suggestion puts its question in the
  reply box (`InboxRoute.test.tsx`); Figma draws no state after the
  press, and nothing sends it.
- **Button labels.** The suggestions are `Button textSize="xs"`
  (`labelXs`, Medium 12/16), as Figma's Medium 12 (d-100); before, they
  took `small` at the label weight through `css()`, the same 12/16
  Medium. Still open: `Composer`'s send is larger than Figma's 26 × 26.
  Library gap: Button label size.
