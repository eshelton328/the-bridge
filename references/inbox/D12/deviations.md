# D12 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D12`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass.
- Position: 13 of 23 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `task pane`, `task bar`, `title block`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the row takes the 4 px grid
  value nearest Figma's (d-100, library #108). Each group below the
  first starts a little lower (NEXT STEPS within tolerance, SNOOZED y +5).
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header), the 4 px grid value nearest Figma's (d-100, library #108).
  The label's centre is 20 px from the header's top (Figma 21).
- **Detail text.** WHY and the prompt use `bodySm` (13/20, #99; WHY
  through `MarkdownView size="sm" padding="none"`, #102), as Figma's WHY
  (346:354 in D1) does, so WHY fits on one line. Figma's prompt lines
  are 21 px apart; `bodySm` keeps 20 (4 px grid). The prompt's five
  lines hold all of it, so it does not fade where Figma fades its fifth
  line (`section · SUGGESTED PROMPT` h -2). Since beta.5 the prompt's
  `bodySm` sits on a block around `Clamp`, not on an inline span: there
  its 13 px text in the panel's 14 px line made 21 px lines, and the
  faded `Clamp` (#104), which now cuts at five lines' height with no
  ellipsis, would hide the fifth. Five 20 px lines are 100 px, not 105,
  so the prompt is 5 px shorter and the layers below it 5 px higher. The
  mono lines in the detail (the task bar, the chips, the tags, the run
  line, the note's author and the source details) use `monoSm` (11/16,
  #102), Figma's 11 px; `MetaChip` and `TagsLine` take `size="sm"`.
  Their line boxes stay 16 px against Figma's 14 (4 px grid), so no
  layer moved.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072).
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Snooze menu.** `Menu` with the heading, the times at the end of their
  rows, a separator, Mark done and a danger Dismiss, 320 px wide with
  44 px rows (`width="md"`, `size="lg"`, #101), as Figma's. It carries
  `menu · Snooze or dismiss` and is 22 px taller (h +22), from the
  library menu's own spacing. Its labels are `bodyLg` (Regular 15/24,
  library #107; Figma Regular 15); the rows stay 44 px.
- **Pick a date and time.** Has its `CalendarIcon` (#101), aligned with
  the other rows.
- **Section offsets.** WHY starts 6 px lower and the sections after it
  10 to 28 px lower (SOURCES y +28), from the title block, the notes box
  and the gaps. Round 3 had 30 to 64: WHY no longer wraps.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `section · MY NOTES` x +4, y +14, h +12 (was x +4, y +23, h +12);
  `section · RUN IN` x +4, y +10, h +1 (was x +4, y +15, h +5);
  `section · SOURCES` x +4, y +28, h +2 (was x +4, y +37, h +2);
  `section · SUGGESTED PROMPT` x +4, y +10, h -2 (was x +4, y +10, h
  +3); `start` x +4, y +13, h -1 (was x +4, y +22, h -1). The cause is
  the 20 px pills (`Badge size="sm"`; Figma's pills are 20, beta.4 drew
  24) and the prompt's 20 px lines (see "Detail text").
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +0, y +18, w +1, h +4); `group · SNOOZED` x +0, y +5, w +1, h +2
  (was x +0, y +29, w +1, h +4); `menu · Snooze or dismiss` x +8, y
  -4, w +0, h +22 (was x +1, y -4, w +0, h +22). The cause is #108's
  compact `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader`
  (36 px, was 38; Figma 34) and Snooze and Dismiss in Medium 12
  (`Button textSize="xs"`), so both buttons are narrower and the menu,
  placed at Snooze's end, moves with it. `menu · Snooze or dismiss`
  moves further from Figma: a Figma-matching change exposes an offset
  that was already there: Dismiss is now 82 px wide against Figma's 86
  (346:5192; the library pads a `sm` button 8 at the sides), and the
  task column already sat 4 px right of Figma's (Detail inset), so
  Snooze ends 8 px right of Figma's and the menu with it; the 14 px
  labels had hidden this.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Notes box (2026-11-18).** The note card is now the `notice`
  `Panel` (10 px at the top and bottom, 12 at the sides), as Figma's
  notes card (D1 346:404), not the `section` one (12 and 16). The note,
  its author and the "Add a note…" field are one `Stack` 4 apart, so
  they start 24 and 20 px apart (Figma 25 and 20). The card is 8 px
  shorter: `section · MY NOTES` y +12 px (was y +12, h +12 px); `section · SOURCES` y +18 px (was y +26 px). The y offsets that stay come from the section
  gaps and line heights above (4 px grid, d-072, d-100).

## Second review

The second review of this frame was run again after PR #13, on a clean
image: the old picture had the popover of an earlier story over it,
which hid some differences.

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
  NOTES 12 to 16 px taller: the type sizes above. (Since beta.7 the approval
  buttons take Figma's Medium 12, `Button textSize="xs"`.)
- Search, Sort and Filter differ by up to 19 px in width, the chip
  counts, placeholder, timestamps and meta lines are brighter, and the
  rail labels sit 4 to 12 px lower: library styles (`SearchField`,
  `Button`, `FilterChips`, `PageHeader`, the rail) and their colour
  tokens. The app sets none of these values. (Fixed in part by beta.5:
  Newest or Sort and Filter take Medium 13 labels and the search field
  13 px text, as Figma's, and the idle chip counts are `fg.subtle`,
  still brighter than Figma's #4a5675, which d-099 keeps out because it
  fails WCAG AA, d-055.)
- The detail column is 4 px to the right: the 40 px inset above.

For D12 it also found:

- P2: no calendar icon, so "Pick a date and time…" is not aligned.
  Fixed in round 5 with #101.
- P2: the menu is 80 px narrower with tighter rows (fixed in round 5:
  320 px, 44 px rows), and the detail shows faintly through it (`surface.overlay`, alpha 0.98): library
  styles. The menu therefore covers less of the title than in Figma.
- The times are brighter: `fg.muted` (the menu recipe) against
  Figma's #4a5675.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
