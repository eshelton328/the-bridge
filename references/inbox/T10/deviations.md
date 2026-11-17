# T10 deviations

What still differs from Figma T10 · Search ("f-005" in the search field, `searchList`, the list of D10 `search`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (40 strings; 2 excepted in `exceptions.json`).
- Position: 6 of 9 layers pass (`header`, `filter · chips`, `list tools`, `search summary`, `group · NEEDS YOU`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h +8.
- `group · RUNNING`: x +2, y +13, w -4, h +4.
- `done hint`: x +2, y +22, w +0, h +0.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower and the list is taller (`inbox list` h). Library gap: Small text
  in the detail.
- **Search summary and Done hint.** The list counts the matches
  ("4 results …") and keeps the Done hint of the state's own search; both
  are `small` text. The summary is in place (`search summary` within
  the tolerance); the hint sits lower by the taller rows above it
  (`done hint` y +22).
- **Layer names as text.** `exceptions.json` excepts the strings that
  get_metadata gives as a layer's name instead of its characters, with
  the text frame.png shows, as D09, D10 and D13 do.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Newest and Filter use `Button textSize="sm"`
  (Medium 13), as Figma's (beta.5, #105). The row actions and other
  small buttons keep the 14 px `label`; Figma sets them in Medium 12,
  which no text style has (d-050), so they are a little wider. Library
  gap: Button label size.
- **Search field and chip counts.** The search field sets its text and
  placeholder in `bodySm` (13 px, `SearchField textSize="sm"`), as
  Figma's. The placeholder stays `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055. Idle filter chip counts are `fg.subtle` (#7986a6,
  #106); Figma's #4a5675 stays out by d-099, because it fails WCAG AA
  (d-055).

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The search field not focused (F1, P1): fixed. The story focuses the field after its checks (`searchbox` has focus), as Erik sees it while he types, so the render shows `SearchField`'s focused border (`border.focus`). Playwright hides the caret. Figma's focused field also tints its fill; `SearchField` changes only the border. Library gap: Styles that differ from Figma.
- The clear icon brighter and larger than Figma's dim grey (F2): stays. `CloseCircleIcon` at `clearSize="16"` in the field's icon colour is the library's clear button (#101). Library gap: Search field and chip count text.

## Show it

- **Show it.** The Done hint's link selects the Done chip, which lists
  the match in Done: the search state holds that Done list (one finished
  task, "Save the Inbox frames as references"), which no frame draws, and
  the hint leaves while Done is selected (`InboxRoute.test.tsx`,
  `listView.test.ts`).
