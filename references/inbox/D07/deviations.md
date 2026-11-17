# D07 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D07`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; the hidden Snooze, Dismiss, Reset and Edit are excepted in
  `exceptions.json`. Dismiss is new this round: the stricter check gives
  each Figma layer its own text run, so "Dismissed: already done by hand"
  no longer covers it.
- Position: 9 of 14 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · TODAY`, `group · YESTERDAY`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55, the 4 px
  grid value nearest Figma's (d-100, library #108). YESTERDAY starts
  within the 4 px tolerance.
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header), the 4 px grid value nearest Figma's (d-100, library #108).
  The label's centre is 20 px from its top (Figma 21).
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
- **Result card.** `Panel tone="done"` (library #107) draws Figma's
  green border (`status.done.border`). It starts 14 px lower (round 3:
  38), from the offsets above.
- **Open chat.** Opens the finished task's chat in the task's place,
  as Reply here does on a running task; View task returns
  (`InboxRoute.test.tsx`). No frame draws the finished chat: it is the
  chat Start opened (D5), with its status Done and its last tool line
  done.
- **Done rows.** `ListRow finished` (#101) draws the title of a done row
  that is not selected in `fg.muted`, as Figma does. Its kind tile fades
  to `opacity.finished` 0.75 against Figma's 0.6 (library #107): at 0.6
  the icons fall to 2.4:1 in light mode, under AA's 3:1 (d-100).
- **Hidden Figma text.** Figma keeps Snooze and Dismiss in the task bar
  and Reset and Edit in the prompt header as hidden layers; the render
  leaves them out, and `exceptions.json` excepts them.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `result card` x +4, y +14, h +1 (was x +4, y +19, h +1);
  `section · MY NOTES` x +4, y +17, h +12 (was x +4, y +22, h +12);
  `section · SOURCES` x +4, y +31, h +2 (was x +4, y +36, h +2);
  `section · SUGGESTED PROMPT` x +4, y +14, h -2 (was x +4, y +14, h
  +3). The cause is the prompt's 20 px lines (see "Detail text").
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · YESTERDAY` within tolerance (was x
  +0, y +10, w +1, h +4). The cause is #108's compact `ListRow` (56
  px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38; Figma
  34).
- **Beta.8 (2026-11-17).** Library 1.0.0-beta.8 (#109); no layer of
  this frame moved. `RunCard` sets its primary button, here Open chat,
  in `textSize="smStrong"` (SemiBold 13) and Open in Workspaces in
  `textSize="sm"` (Medium 13), as T4 sets Reply here and Open in
  Workspaces in Figma (346:6297, 346:6303). D7's text boxes (346:3082,
  346:3088) have the same height; Open chat's type was not read from
  Figma.

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
  NOTES 12 to 16 px taller: the type sizes above. (Since beta.7 the
  rows are 56 px against 55.)
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

For D07 it also found:

- P2: Figma dims the titles and kind tiles of the done rows that are not
  selected; the render draws them as open rows. `ListRow` has a dimmed
  `snoozed` state but no finished one, and a snoozed row is a different
  thing, so the render does not borrow it. Library gap to add: a
  finished (dimmed) `ListRow`. (Fixed: `ListRow finished`, #101, dims
  the title, and since #107 the kind tile fades to 0.75; see "Done
  rows".)
- "Dismissed: already done by hand" and the times are brighter: the
  `fg.subtle` token and the type sizes.

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and
  the title "Workspaces is not built yet", keeps the focus and does
  nothing on a press (`InboxRoute.test.tsx`); since beta.5 (#105) a
  disabled secondary `Button` no longer fades: it keeps its fill and
  border and only its label and icon turn `fg.muted`, where Figma draws
  it enabled.
