# M25 deviations

What still differs from Figma M25 · Removed, in Done (`removedPhone`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.7, which adds #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (39 strings checked).
- Position: 11 of 12 layers pass (`header`, `filter · chips`, `list tools`, `group · TODAY`, `group · YESTERDAY`, `tab bar`).
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
  library #108), so `group · YESTERDAY` starts within tolerance of
  Figma's. The list's box ends 10 px above Figma's (`inbox list`
  h -10).
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4). Library gap: Breakpoint tokens.
  The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone). The chip row scrolls sideways and clips, as Figma's
  does; the fade is missing (Library gap: Chip row fade).
- **Next steps count.** Figma counts 5 next steps here, after the
  three tasks M22 created; T24 counts 2. The state copies M25's count,
  so it has its own state.
- **Finished rows.** As in M12: each row says how it ended, the removed
  one in red with a bin. The outcome line is `small` (13 px) against
  Figma's Regular 12. Library gap: Small sans text for row lines. Each
  kind tile fades to `opacity.finished` 0.75 against Figma's 0.6
  (library #107): at 0.6 the icons fall to 2.4:1 in light mode, under
  WCAG AA's 3:1 (d-100).
- **Restore.** The note says the removed task's page has Restore, which
  no frame draws (D21 draws it on the desktop). Opening the row shows
  that page with Open discussion and Restore; Restore puts the task back
  in Next steps and the page shows it as a next step again
  (`InboxRoute.test.tsx`, from the keyboard too). The note says this
  flow is not decided; d-101 keeps it as built: a removed task goes to
  Done with its reason, and Restore puts it back.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +0, y +0, w +0, h -10 (was x
  +0, y +0, w +0, h +10); `group · YESTERDAY` within tolerance (was x
  +0, y +10, w +0, h +4). The cause is #108's compact `ListRow` (56
  px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38; Figma
  34).
