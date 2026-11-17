# T13 deviations

What still differs from Figma T13 · Snooze or dismiss (the Snooze menu open on the task page, `snoozePage`, T2 `taskPage`), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (49 strings).
- Position: 5 of 13 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. The position check renders the page 29 px
shorter, below Figma's status bar, and adds 29 to each render y (d-101).

- `task · next step`: x +2, y +4, w -4, h -9.
- `section · SUGGESTED PROMPT`: x +2, y +8, w -4, h -2.
- `section · RUN IN`: x +2, y +8, w -4, h +1.
- `start`: x +2, y +11, w -4, h -1.
- `section · MY NOTES`: x +2, y +12, w -4, h +7.
- `notes field`: x +2, y +14, w -4, h +5.
- `section · SOURCES`: x +2, y +21, w -4, h +2.
- `menu · Snooze or dismiss`: x -5, y -6, w +0, h +22.

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
- **Detail spacing.** As in T02: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), so each section starts a little lower
  than the one above it. The title is `title` (20/28) against Figma's
  22 px (library gap: 22 px title). `BackRow` is 28 px high against
  Figma's 32 (`nav · back` h -4).
- **Offsets exposed by beta.5.** Two Figma-matching changes made the
  detail 9 px shorter (`task · next step` h -9). The prompt now sits in
  five 20 px `bodySm` lines: the faded `Clamp` cuts by height (#104), so
  the prompt's text style moved from an inline span, whose 13 px text in
  the panel's 14 px line made 21 px lines, onto a block. Figma's lines
  are 21, which no token has; the prompt section box is now within the
  tolerance (`section · SUGGESTED PROMPT` h +3 → -2), and `section · RUN
  IN` starts 5 px higher than before (now y +8). The Recommended pill is
  now 20 px (`Badge size="sm"`, #106), as Figma's pills are,
  against 24 before, so the Run in card is 1 px taller than Figma's 85
  (h +5 → +1), and the
  layers below it start 9 px higher than before (now `start` y +11,
  `section · MY NOTES` y +12, `notes field` y +14, `section · SOURCES`
  y +21).
- **Snooze menu.** As in D12: `Menu size="lg" width="md"` has
  Figma's 320 px width and 44 px rows, but its heading and separator
  make it 22 px taller (`menu · Snooze or dismiss` h +22); it opens 5
  px further left, under the wider Snooze button (button labels).
- **Tab bar.** `TabBar` spreads its five tabs over the full width;
  Figma centres five 91 px tabs. The bar itself (`tab bar`) is in place.
  Library gap: Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The suggested prompt's last line not faded (F1): stays, as recorded on T02, T04 and T08: `Clamp` fades only a text it cuts, and the prompt's lines hold all of it. (Since beta.5 a cut prompt ends with no ellipsis, #104.)
- The MY NOTES field 5 px taller and its placeholder a little larger (F2): stays. `TextArea textSize="sm"` with one row is 44 px high against Figma's 39 (346:8502, `notes field` h +5); the field's padding and 20 px line are the library's, and Figma's 17 px placeholder line and 11 px inset have no token. Library gap: Panel and text field padding.
- The Snooze menu's times lighter than Figma's dim grey, and the check before Mark done dimmer than Figma's (F3): stays. The menu draws a time in `mono`, `fg.muted`, because `fg.subtle` (Figma's #4a5675) is not for `surface.overlay`, and every item icon in `fg.muted` (the menu recipe, D12). Library gap: Styles that differ from Figma.
