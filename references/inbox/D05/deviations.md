# D05 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D05`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass.
- Position: 11 of 16 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `task pane`, `started task`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55, the 4 px
  grid value nearest Figma's (d-100, library #108). Each group below
  the first starts a little lower: NEXT STEPS within the 4 px
  tolerance, SNOOZED y +6, RUNNING y +8.
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header), the 4 px grid value nearest Figma's (d-100, library #108).
  The label's centre is 20 px from its top (Figma 21).
- **Started task header.** Its meta line uses `monoSm` (11/16, #102),
  Figma's 11 px, and fits on one line, so `started task` now passes
  (round 5: h +12, the 12 px `mono` line wrapped "5.5").
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie).
- **Button labels.** Copy under Claude's reply is `Button size="xs"
  textSize="xs"`: 24 px high against Figma's 22, the 4 px grid value
  (d-100). Its label is Medium 12 against Figma's 11 (346:2265); no
  label style is 11 (LIBRARY_GAPS.md, Button label size). The reply
  box's Stop and send are as before: `Composer` draws 28 px controls
  with 14 px labels, larger than Figma's (same row).
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +0, y +18, w +1, h +4); `group · SNOOZED` x +0, y +6, w +1, h +2
  (was x +0, y +28, w +1, h +4); `group · RUNNING` x +0, y +8, w +1, h
  +2 (was x +0, y +32, w +1, h +4). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.

## Second review

Rounds 4 to 6 had no new second review: round 4 changed only the row
and body text sizes, round 5 only put in the #101 parts and round 6
only the #102 small sizes; the checks
above measure those. The findings below are from
the earlier rounds; those about taller rows and wider detail text are
now smaller (see "List row heights" and "Detail text").

Round 2's review; round 3 changed only the parts below. Library main
66a44c5 fixed two of its findings in every frame: Sort now shows
`SortDescIcon` (Figma's arrow with lines), and status pills have no
border. A separate agent compared `frame.png` with the render, without these
notes. What it found in every frame, and why it stays:

- List rows taller, list text and approval buttons larger, detail text
  wider: the type sizes above. (Since beta.7 the rows are 56 px against
  55, and the approval row's Allow once, Deny and Open chat take Medium
  12 labels, `textSize="xs"`, as Figma's.)
- Search, Newest and Filter differ by up to 18 px in width, the filter
  chip counts, the pane count, timestamps, meta lines and section labels
  are brighter, and the rail labels sit 4 to 12 px lower: library styles
  (`SearchField`, `Button`, `FilterChips`, `PageHeader`, the rail) and
  their colour tokens. The app sets none of these values. (Fixed in part
  by beta.5: Newest or Sort and Filter take Medium 13 labels and the
  search field 13 px text, as Figma's, and the idle chip counts are
  `fg.subtle`, still brighter than Figma's #4a5675, which d-099 keeps
  out because it fails WCAG AA, d-055.)
- The NCC chip's tint is fainter than Figma's (`MetaChip tone="issue"`):
  library style.
- The detail column is 4 px to the right: the 40 px inset above.

For D05 it also found:

- The meta line of the header wraps "5.5" (see above); the prompt bubble
  and Claude's message break their lines earlier and the Copy button is
  larger: the type sizes. (Since beta.7 Copy is 24 px high with a
  Medium 12 label, against Figma's 22 and 11; see "Button labels".)
- The dot before "Creating 9 issues in NCC…" was lavender, not cyan:
  fixed in the library (#98, `ToolLine` running dot).
- The composer has no cyan focus border (a story cannot focus a field
  without a user action), its Stop icon is an outline square and its
  model chevron is thin: library styles.

## Running row

- **Running row.** The D6 note says a click on a task under Running
  opens the task page (D6). D5 draws that row selected beside the chat,
  and its state's detail is the chat, so on the desktop the row keeps the
  chat. The tablet and phone lists (T6, M11) open the task page.

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and
  the title "Workspaces is not built yet", keeps the focus and does
  nothing on a press (`InboxRoute.test.tsx`); since beta.5 (#105) a
  disabled secondary `Button` no longer fades: it keeps its fill and
  border and only its label and icon turn `fg.muted`, where Figma draws
  it enabled. Its label is `textSize="xs"` (Medium 12), the type read
  from Figma (346:2239, d-106); no layer of this frame moved.
