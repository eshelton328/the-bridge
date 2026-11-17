# D07 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D07`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden Snooze, Dismiss, Reset and Edit are excepted in
  `exceptions.json`. Dismiss is new this round: the stricter check gives
  each Figma layer its own text run, so "Dismissed: already done by hand"
  no longer covers it.
- Position: 8 of 14 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · TODAY`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (YESTERDAY y +10),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99; WHY through
  `MarkdownView size="sm" padding="none"`, #102), as
  Figma's WHY (346:354 in D1) does, so WHY fits on one line. Figma's
  prompt lines are 21 px apart; `bodySm` keeps 20 (4 px grid). The
  prompt's five lines hold all of it, so it does not fade where Figma
  fades its fifth line (`section · SUGGESTED PROMPT` h +7).
  The mono lines in the detail (the task bar, the chips, the tags, the
  run line, the note's author and the source details) use `monoSm`
  (11/16, #102), Figma's 11 px; `MetaChip` and `TagsLine` take
  `size="sm"`. Their line boxes stay 16 px against Figma's 14 (4 px
  grid), so no layer moved.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Result card.** `Panel` with the default border. Figma's result
  card has a green border, and the library has no token for it (#101
  left it out, d-050); `tone="accent"` would draw it cyan, as a running
  card. It starts 23 px lower (round 3: 38), from the offsets above.
- **Done rows.** `ListRow finished` (#101) draws the title of a done row
  that is not selected in `fg.muted`, as Figma does. Figma also fades
  the kind tile of such a row to 0.6; no token has that opacity.
- **Hidden Figma text.** Figma keeps Snooze and Dismiss in the task bar
  and Reset and Edit in the prompt header as hidden layers; the render
  leaves them out, and `exceptions.json` excepts them.

## Second review

Rounds 4 to 6 had no new second review: round 4 changed only the row
and body text sizes, round 5 only put in the #101 parts and round 6
only the #102 small sizes; the checks
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

For D07 it also found:

- P2: Figma dims the titles and kind tiles of the done rows that are not
  selected; the render draws them as open rows. `ListRow` has a dimmed
  `snoozed` state but no finished one, and a snoozed row is a different
  thing, so the render does not borrow it. Library gap to add: a
  finished (dimmed) `ListRow`.
- "Dismissed: already done by hand" and the times are brighter: the
  `fg.subtle` token and the type sizes.
