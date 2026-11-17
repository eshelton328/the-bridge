# T15 deviations

What still differs from Figma T15 · Filtered (the list with a project filter, `filteredList`, the list of D13 `filtered`), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (58 strings; 1 excepted in `exceptions.json`).
- Position: 8 of 11 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `filters applied`, `group · NEEDS YOU`, `group · NEXT STEPS`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `group · SNOOZED`: x +2, y +7, w -4, h +2.
- `group · RUNNING`: x +2, y +9, w -4, h +2.
- `hidden count`: x +2, y +12, w -1.3, h +0.

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
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower
  (`group · SNOOZED` y +7, `group · RUNNING` y +9); the list's height
  is within the tolerance.
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (359:349). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Filters that apply.** The library has no removable filter chip;
  a pressed small `Button` with an x stands for each value (`filters
  applied` h +2). Library gap: Removable filter chip.
- **Hidden count.** The line under the list sits lower by the rows and
  headers above it (`hidden count` y +12).
- **Layer names as text.** `exceptions.json` excepts the strings that
  get_metadata gives as a layer's name instead of its characters, with
  the text frame.png shows, as D09, D10 and D13 do.
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The approval row's Allow
  once, Deny and Open chat take `textSize="xs"` (`labelXs`, Medium
  12/16), Figma's Medium 12 (d-100). The labels match Figma's; the
  values that apply are under Filters that apply.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` within tolerance (was x +2, y
  +0, w -4, h +26); `group · NEXT STEPS` within tolerance (was x +2, y
  +20, w -4, h +4); `group · SNOOZED` x +2, y +7, w -4, h +2 (was x
  +2, y +27, w -4, h +4); `group · RUNNING` x +2, y +9, w -4, h +2
  (was x +2, y +31, w -4, h +4); `hidden count` x +2, y +12, w -1.3, h
  +0 (was x +2, y +40, w -1.3, h +0). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The values that apply ("ncc-1701", "omni-brain") in sans 14 px against Figma's small mono chips (F1): fixed in part. Each value is now in `monoSm` (Geist Mono 11, as 359:539 is). The chip is still a pressed small `Button` (taller, with a 12 px x and the button's border) because the library has no removable filter chip. Library gap: Removable filter chip.
- The search placeholder larger and lighter (F2): fixed in part by beta.5: the placeholder is 13 px, as Figma's; its colour stays `fg.subtle` by d-055.
