# M08 deviations

What still differs from Figma after the review fix round of the
fidelity loop (`pnpm fidelity artifacts M08`, 2026-11-18, against the
installed library 1.0.0-beta.27), each with its reason. That round
changed only the library under the scrim (the rows' side padding, the
group gap and the Sort and Filter icons); the drawer is unchanged. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M8 is M1's library on the
phone with the More drawer open over the tab bar (`ui.moreOpen`). The
drawer is the shared block `web/src/blocks/MoreDrawer.tsx`, on the
library's `MoreDrawer`, as in Toolkit M4; this page does not change it.
The library under the scrim has M1's differences (`../M01/deviations.md`).

## Checks

- Text: passes. Every string of the library, the tab bar and the drawer
  is in the render and seen.
- Position: 27 of 29 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the nine artifact rows, `tab bar` and its
  five items, `icon/layers`, `icon/brain` and `icon/flow`).
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`), as in M1: Figma's library (415:28) runs to y 875,
  past the frame's bottom edge, under the pinned tab bar, and the render
  scrolls the same way (d-107).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `filter · chips`: w +4.2 (h +2).
- `icon/toolkit`: no layer of that name in M8.

## Deviations: the drawer

- **Toolkit after Artifacts.** The render lists Toolkit as an open item
  right under Artifacts, with a chevron, and Later holds Brain and
  Workflows only. Figma's M8 lists Toolkit under Later, dimmed and
  without a chevron (`more item · Toolkit` 415:332 at y 615, under
  `group · LATER` 415:330 at y 579). The shared drawer follows Toolkit
  M4 (424:6940), where Toolkit has its page and comes after Artifacts
  (d-105); the drawer is shared, so this page keeps it. Later's header
  sits under the Toolkit row, lower than Figma's, while Brain and
  Workflows end near Figma's (`icon/brain` and `icon/flow` pass).
  `icon/toolkit` is the shared drawer's name
  for the Toolkit icon; Figma's M8 names it `icon/tool` (415:334), which
  the shared block does not use.
- **Drawer top edge.** The drawer's top edge is at y 445 against
  Figma's 450 (`drawer · More` 415:315, 390 × 394): it is 399 high
  against 394, so it starts about 5 px higher. The drawer is the shared
  `MoreDrawer` (library `SizedBottomSheet size="lg"`), whose header and
  item spacing set its height; this page does not change a shared part.
- **Grabber colour.** The grabber is `border.default` (#24314f, a blue
  slate) against Figma's neutral light grey (#4c566f, 415:317 in the
  grabber row 415:316). The library's bottom sheet draws its grabber in
  `border.default`; this page does not change a shared part.
- **Layer names.** The shared drawer marks only its icons with
  `data-figma`, so the drawer's frame, title, rows and Later header
  (415:315 to 415:352) are not position-checked; the side-by-side shows
  them where Figma has them, within a few px.

## Deviations: the library under the scrim (as M1)

- **Source chips.** `filter · chips` w +4.2, h +2: `FilterChips
  size="compact"` puts the chips 6 apart with 8 px sides, Figma 5 and 9.
  Library gap "Compact chip spacing".
- **Rows.** The row previews are smaller than Figma's 76 × 48, drawn in
  the library's colours, and the rows are 62 high and 6 apart against
  66 and 2. Library gaps "List row thumbnail", "Thumbnail colour" and
  "List row padding and age".
- **New badge.** New is a 57 × 20 pill with a 12 px outline spark
  against Figma's 48 × 16 pill with a filled four-point star (415:99,
  415:100); the fill is Figma's teal. Library gap "New badge".
- **Device chrome.** The status bar (9:41), the home indicator
  (415:312) and the screen corners are not drawn (d-089); the checks
  measure the render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- The drawer's Artifacts item shows the library's count, 24
  (`data.count`), and no count on Toolkit, as Figma has none.
- The phone's More sets `ui.moreOpen`; the scrim, Escape and a pick
  close the drawer. Picking Toolkit goes to its page through the page
  entry; Artifacts is the page on screen. The drawer opens at any width
  when a state sets `moreOpen`, so the story shows it at the width
  Storybook gives it, as Toolkit M4's does.
