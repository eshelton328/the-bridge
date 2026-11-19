# M22 deviations

What still differs from Figma M22 · The new tasks in the inbox (`tasksCreatedPhone`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (48 strings checked; 17 Figma strings under exceptions.json).
- Position: 12 of 13 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `group · SNOOZED`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (1 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `toast · created`: x -4, y +0, w +8, h +0.

## Deviations

- **New rows (step 13).** Figma puts each line of a row 4 under the one above (402:7553, itemSpacing 4), and its New row has a 1 px border in its layout: 1 + 10 + 17 + 4 + 14 + 4 + 20 + 10 + 1 = 81. A compact `ListRow` puts its lines 2 apart, because its 16 px text lines are taller than Figma's 14 and 17; the 20 px pill does not grow, so `InboxRow` gives the pill line the other 2. Each New row is 80 high (Figma's 81 on the 4 px grid), and `group · SNOOZED` passes.
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
  library #108), so each later group starts a little lower, within
  tolerance (`group · NEXT STEPS`, `group · SNOOZED` pass).
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4). Library gap: Breakpoint tokens.
  The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows pad 4 at the sides
  (`ListRow padding="phoneSides"`), so the kind tiles line up under
  the group chevrons, and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone). The chip row scrolls sideways and clips, as Figma's
  does; the fade is missing (Library gap: Chip row fade).
- **Needs you closed.** Figma closes Needs you on the phone, where T21
  opens it, so M22 has its own state. Figma keeps the closed group's
  rows in its layers, all at y 212; `exceptions.json` lists their text
  as hidden layers.
- **New rows.** The new tasks are `ListRow` rows with a `StatusPill`
  "New"; Figma draws them as bordered rows on a raised fill. Library
  gap: New list row.
- **Toast.** `Toast` over the bottom of the list, full width less the
  list's padding (`toast · created` x -4, w +8). It is anchored to the
  bottom, 12 above the tab bar, as Figma draws it (`toast · created` y
  +0): the list fills the screen above the tab bar
  when it has a toast.
  It used to follow the last group, 47 above the tab bar. The new tasks
  come from the discussion's proposal applied in the state's `ui`, so
  Undo takes them out (the Inbox route tests).
- **List fits.** The checks render 806 px high (d-102). The list fits
  the screen above the tab bar, as Figma's does (`main.app-shell__detail`
  does not scroll), so the rules check passes. With 58 px rows and 38 px
  headers it was 3 px too tall and scrolled.
- **Button labels.** Sort and Filter are icons, and the toast's Undo
  is `Toast`'s own action. The approval row's buttons (`textSize="xs"`,
  Medium 12 as Figma's) sit in the closed Needs you group. No label in
  this frame is open in the library.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · SNOOZED` within tolerance (was x
  +0, y +22, w +0, h +4); `toast · created` x -4, y +0, w +8, h +0
  (was x -4, y +3, w +8, h +0). The cause is #108's compact `ListRow`
  (56 px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38;
  Figma 34).
- **Beta.18 (2026-11-17, step 12).** `group · SNOOZED` changes from a
  pass to y -6. The StatusPill is now Figma's 20 high (library #122; was
  22), so each of the three created task rows with a "New" pill (402:7547,
  402:7561, 402:7575, 81 high in Figma) is 2 px shorter. The old pill's
  extra 2 px hid the grid line heights (d-100) of those rows.
