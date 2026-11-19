# M14 deviations

What still differs from Figma M14 · Search (`searchList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (38 strings checked; 2 Figma strings under exceptions.json).
- Position: 13 of 14 layers pass (`header`, `filter · chips`, `list tools`, `search summary`, `group · NEEDS YOU`, `group · RUNNING`, `done hint`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h -10.

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
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108), so `group · RUNNING` and `done hint` start within
  tolerance of Figma's. The list's box ends 10 px above Figma's (`inbox
  list` h -10; see the Beta.7 bullet).
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
  the group chevrons, and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Search.** The field shows "f-005" with its clear button, Sort and
  Filter beside it, the summary under the tools and the matches marked
  in cyan, in their groups. The clear icon is `fg.subtle` (library
  #107) against Figma's #4a5675, which fails WCAG AA (d-099). Figma
  draws the field focused with a caret
  and the keyboard up. The story focuses the field (`toHaveFocus`, the
  T10 and M14 story), so the render shows its focused border; the
  keyboard is design-only chrome (d-089), so none covers the list, and
  the Done hint shows under the Running row (`done hint` within
  tolerance).
  Figma's metadata gives the summary and the hint by their layer names;
  the exceptions say why.
- **Show it.** The Done hint's link selects the Done chip, which lists
  the match in Done: the search state holds that Done list (one finished
  task, "Save the Inbox frames as references"), which no frame draws, and
  the hint leaves while Done is selected (the Inbox route tests,
  `listView.test.ts`).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -10 (was x
  +0, y +0, w +0, h +6); `group · RUNNING` within tolerance (was x +0,
  y +11, w +0, h +4); `done hint` within tolerance (was x +0, y +20, w
  +0, h +0). The cause is #108's compact `ListRow` (56 px, was 58;
  Figma 55) and list `GroupHeader` (36 px, was 38; Figma 34). `inbox
  list` moves further from Figma: a Figma-matching change exposes an
  offset that was already there: Figma's list (346:11865) ends 14 px
  under the done hint (346:11981, y 520 to 536); the render's ends
  about 4 px under it, which the taller rows and headers had hidden.
