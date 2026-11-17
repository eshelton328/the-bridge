# T07 deviations

What still differs from Figma T7 · Done (Done, the list, `doneList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106; no layer moved), each
with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 5 of 7 layers pass (`header`, `filter · chips`, `list tools`, `group · TODAY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. The position check renders the page 29 px
shorter, below Figma's status bar, and adds 29 to each render y (d-101).

- `inbox list`: x +2, y +0, w -4, h +12.
- `group · YESTERDAY`: x +2, y +12, w -4, h +4.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 29 px shorter and adds
  29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **List rows and group headers.** As in D01: `ListRow
  density="compact"` rows are 58 px against Figma's 55 and group
  headers 38 against 34 (4 px grid, d-072), so each later group starts
  lower. Library gap: Small text in the detail.
- **Done rows.** Figma fades the kind tiles of done rows (0.6); no
  opacity token has it, and the fade waits on Erik (d-050). Library
  gap: Styles that differ from Figma.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
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

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- The outcome line under each row is one size larger: stays. Figma
  sets it in Geist Regular 11 (346:6834, 346:6850, 346:6888); `ListRow`
  draws its lines in `small` (12) and no sans style has 11 px (library
  gap: Small sans text for row lines).
- The outcome green brighter, the dismissed grey lighter: stays. The
  green is `status.done.fg` #6ee7a8, the colour Figma uses for done; its
  smaller 11 px glyphs peak at #5ed98f in `frame.png`. The dismissed
  line is `fg.subtle` #7986a6 against Figma's #4a5675 (d-055).
- Search placeholder larger and lighter than Figma's: stays.
  `SearchField` draws its text in `body` (14 px) at every size against
  Figma's 13 (library gap: Search field and chip count text, the same in
  D01 to D21). Its colour is `fg.subtle` #7986a6 against Figma's
  #4a5675 by d-055.
  (Fixed by beta.5: `SearchField textSize="sm"` sets the text and
  placeholder in `bodySm`, 13 px; the colour stays by d-055.)
- Chip counts lighter than Figma's: stays. `FilterChips`
  draws counts in `fg.muted`; Figma draws them in #4a5675 (same library
  gap, the same in D01 to D21).
  (Beta.5 draws idle counts in `fg.subtle`, #7986a6; Figma's #4a5675
  stays out by d-099.)
- Rounded screen corners in Figma: stays. They are the device frame,
  design-only chrome (d-089); the app draws no device.
