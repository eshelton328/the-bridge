# T10 deviations

What still differs from Figma T10 · Search ("f-005" in the search field, `searchList`, the list of D10 `search`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (40 strings; 2 excepted in `exceptions.json`).
- Position: 1 of 9 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +8; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `search summary`: x +2, y -31, w -1.2, h +0; 29 px removed: y -2.
- `group · NEEDS YOU`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · RUNNING`: x +2, y -16, w -4, h +4; 29 px removed: y +13.
- `done hint`: x +2, y -7, w +0, h +0; 29 px removed: y +22.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets above give the rest as "29 px removed". Measuring below the
  status bar is an open request to Erik. Library gap: Top and bottom
  safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower and the list is taller (`inbox list` h). Library gap: Small text
  in the detail.
- **Search summary and Done hint.** The list counts the matches
  ("4 results …") and keeps the Done hint of the state's own search; both
  are `small` text, in place but for the status bar and the taller rows
  above the hint (`done hint`).
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
