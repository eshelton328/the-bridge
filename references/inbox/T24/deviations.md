# T24 deviations

What still differs from Figma T24 · Removed, in Done (`removedList`, D21's Done list on the tablet), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 6 of 13 layers pass (`header`, `filter · chips`, `list tools`, `group · TODAY`, `group · YESTERDAY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h -8.

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
  library #108). The later group starts within the tolerance
  (`group · YESTERDAY`), and the list is 8 px shorter than Figma's
  (`inbox list` h -8).
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (402:12640). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **Done rows.** As in T07: the outcome lines are `small` (12/16)
  against Figma's Regular 11 (library gap: Small sans text for row
  lines). A finished row fades its kind tile to `opacity.finished` 0.75
  against Figma's 0.6 (library #107): at 0.6 the icons fall to 2.4:1 in
  light mode, under the 3:1 an icon needs (d-100).
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Button labels.** Newest and Filter use `Button textSize="sm"`
  (Medium 13), as Figma's (beta.5, #105). No other button shows. The
  labels match Figma's.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` x +2, y +0, w -4, h -8 (was x
  +2, y +0, w -4, h +12); `group · YESTERDAY` within tolerance (was x
  +2, y +12, w -4, h +4). The cause is #108's compact `ListRow` (56
  px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38; Figma
  34).

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Chip counts lighter, search placeholder lighter and about 1 px larger (P3): fixed in part by beta.5: the placeholder is 13 px and idle counts are `fg.subtle`; Figma's #4a5675 stays out by d-099 (fails WCAG AA, d-055).
- Square corners where Figma's frame is rounded (P4): device chrome, which belongs to the canvas (d-089).
