# M16 deviations

What still differs from Figma M16 · Filtered (`filteredList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (57 strings checked; none under exceptions.json). The list
  runs under the tab bar (AppShell `tabBarOverlay`, library
  1.0.0-beta.26), so "1 task hidden by filters" lies under the bar as
  Figma draws it, and the check counts the covered line as shown.
  `frame.json` holds that line's characters (layer 359:252), read with
  a read-only `use_figma` call and saved with `pnpm fidelity:refs
  --characters` (Erik's decision, 2026-11-17).
- Position: 13 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `filters applied`, `group · NEEDS YOU`, `group · NEXT STEPS`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `group · SNOOZED`: x +0, y +5, w +0, h +2.
- `group · RUNNING`: x +0, y +7, w +0, h +2.
- `hidden count`: x +0, y +10, w -1.3, h +0.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Waiting for a design: Device chrome (d-089).
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so each later group starts a little lower
  (`group · NEXT STEPS` and `inbox list` within tolerance,
  `group · SNOOZED` y +5, `group · RUNNING` y +7).
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. Library gap: Breakpoint tokens. The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows pad 4 at the sides
  (`ListRow padding="phoneSides"`), so the kind tiles line up under
  the group chevrons, and each chip pads its label 12
  inside its 1 px border, 13 from its edge against Figma's 12
  (`FilterChips size="phone"`, so each chip is 2 px wider).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Filters that apply.** The Filter icon is pressed with its cyan dot
  (`Button indicator`), and the row under the tools lists Project with
  ncc-1701 and omni-brain, each with an x that removes it, and Clear.
  Each value is a pressed small `Button`, 28 px high against Figma's
  22 px chips (`filters applied` h +2). Library gap: Removable filter
  chip.
- **Hidden count.** "1 task hidden by filters" ends the list, under the
  tab bar, as in Figma; the rows and group headers above it put it a
  little lower (`hidden count` y +10).
- **Running row below the fold.** The checks render 806 px high, the
  screen below the status bar (d-102). The Running group starts 7 px
  lower than Figma's (`group · RUNNING` y +7), and its row's meta line
  (`ncc-1701 · f-005 · NCC-28`), chat line
  (`quiet-nebula · Creating 9 issues…`) and `Working` pill show above
  the tab bar, as in Figma, so the text check passes.
- **Button labels.** The approval row's Allow once, Deny and Open chat
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Sort and Filter are icons, Clear is a link, and the
  applied values are pressed small buttons (see Filters that apply).
  No other label in this frame is open in the library.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` within tolerance (was x +0, y
  +0, w +0, h +24); `group · NEXT STEPS` within tolerance (was x +0, y
  +18, w +0, h +4); `group · SNOOZED` x +0, y +5, w +0, h +2 (was x
  +0, y +25, w +0, h +4); `group · RUNNING` x +0, y +7, w +0, h +2
  (was x +0, y +29, w +0, h +4); `hidden count` x +0, y +10, w -1.3, h
  +0 (was x +0, y +38, w -1.3, h +0). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).
