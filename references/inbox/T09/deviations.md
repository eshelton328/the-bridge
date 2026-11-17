# T09 deviations

What still differs from Figma T9 · Sort (the Sort menu open over the list, `sortList`, the list of D9 `sortOpen`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (66 strings; 1 excepted in `exceptions.json`).
- Position: 3 of 10 layers pass (`group · SNOOZED`, `group · RUNNING`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `inbox list`: x +2, y -29, w -4, h +27; 29 px removed: y +0.
- `header`: x +2, y -29, w -4, h -2; 29 px removed: y +0.
- `filter · chips`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `list tools`: x +2, y -27, w -4, h -4; 29 px removed: y +2.
- `group · NEEDS YOU`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `group · NEXT STEPS`: x +2, y -11, w -4, h +4; 29 px removed: y +18.
- `menu · Sort`: x +14, y -33, w -20, h +8; 29 px removed: y -4.

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
- **Sort menu.** `RadioMenu width="sort"` is 280 px wide; Figma's
  tablet menu is 300 (346:7473; D9's is 280), so it starts 14 px to the
  right (`menu · Sort` x +14, w -20). It was 11 before beta.5: the Sort
  button's label is now Medium 13 (`Button textSize="sm"`), as Figma's,
  so the button is narrower and the menu under it moves 3 px; this
  exposes the existing offset of the 280 px menu against Figma's 300. Its rows are 56 px against Figma's
  50, a library style, so it is 8 px taller. Library gaps: Sort menu
  width on the tablet, Styles that differ from Figma.
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

- The search field's placeholder and icon larger and lighter (F1, F2), and the chip counts lighter (F6): stays. Library gap: Search field and chip count text. (Beta.5 sets the placeholder at 13 px, `SearchField textSize="sm"`; its colour and the counts' `fg.subtle` stay by d-055 and d-099.)
- Sort menu descriptions ("Most recent activity at the top") and the note "Sorting applies inside each group." one size larger (F3): stays. Figma sets them in Regular 11 (346:7479, 346:7499, 14 px boxes); `RadioMenu` draws them in `small` (12/16), and no sans style has 11 px. Library gap: Small sans text for row lines.
- The note lighter than Figma's dim grey (F4): stays. It is `fg.muted`; Figma's #4a5675 is `fg.subtle`'s role, and `fg.subtle` is not for `surface.overlay` (the menu recipe, d-055). Library gap: Styles that differ from Figma.
- Row status lines ("Codex is waiting", "Blocks hono server", "quiet-nebula · Creating 9 issues…") one size larger (F5): stays. `ListRow` lines are `small` (12) against Figma's 11. Library gap: Small sans text for row lines.
- "Inbox" a little larger (F7): stays. `PageHeader size="phone"` draws the title in its own style with a 40 px line against Figma's 34 px text box (346:7261) in a 42 px header (`header` h -2, 4 px grid, d-072). Library gap: Styles that differ from Figma.
