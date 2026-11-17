# D12 deviations

What still differs from Figma after round 5 of the fidelity loop
(`pnpm fidelity inbox D12`, 2026-11-16, against the installed
library 1.0.0-beta.2, which has #97 to #101), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 8 of 17 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +29),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99), as
  Figma's WHY (346:354 in D1) does, so WHY fits on one line. Figma's
  prompt lines are 21 px apart; `bodySm` keeps 20 (4 px grid). The
  prompt's five lines hold all of it, so it does not fade where Figma
  fades its fifth line (`section · SUGGESTED PROMPT` h +7).
  The mono lines in the detail (the task bar, the chips, the run line)
  stay in `mono` (12 px) against Figma's 11; this round changed only
  the body text.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Snooze menu.** `Menu` with the heading, the times at the end of their
  rows, a separator, Mark done and a danger Dismiss, 320 px wide with
  44 px rows (`width="md"`, `size="lg"`, #101), as Figma's. It carries
  `menu · Snooze or dismiss` and is 22 px taller (h +22), from the
  library menu's own spacing. Its labels are in the
  menu's own style, not Figma's Regular 15 (library gap: Regular 15 px
  text).
- **Pick a date and time.** Has its `CalendarIcon` (#101), aligned with
  the other rows.
- **Section offsets.** WHY starts 6 px lower and the sections after it
  10 to 49 px lower (SOURCES y +49), from the title block, the notes box
  and the gaps. Round 3 had 30 to 64: WHY no longer wraps.

## Second review

Rounds 4 and 5 had no new second review: round 4 changed only the row
and body text sizes, and round 5 only put in the #101 parts; the checks
above measure those. The findings below are from
the earlier rounds; those about taller rows and wider detail text are
now smaller (see "List row heights" and "Detail text").

A separate agent compared `frame.png` with the render, without these
notes. What it found in every frame, and why it stays:

- List rows taller, list, title and detail text larger, approval
  buttons larger, WHY on two lines, the prompt without its fade, MY
  NOTES 12 to 16 px taller: the type sizes above.
- Search, Sort and Filter differ by up to 19 px in width, the chip
  counts, placeholder, timestamps and meta lines are brighter, and the
  rail labels sit 4 to 12 px lower: library styles (`SearchField`,
  `Button`, `FilterChips`, `PageHeader`, the rail) and their colour
  tokens. The app sets none of these values.
- The detail column is 4 px to the right: the 40 px inset above.

For D12 it also found:

- P2: no calendar icon, so "Pick a date and time…" is not aligned.
  Fixed in round 5 with #101.
- P2: the menu is 80 px narrower with tighter rows (fixed in round 5:
  320 px, 44 px rows), and the detail shows faintly through it (`surface.overlay`, alpha 0.98): library
  styles. The menu therefore covers less of the title than in Figma.
- The times are brighter: `fg.muted` (the menu recipe) against
  Figma's #4a5675.
