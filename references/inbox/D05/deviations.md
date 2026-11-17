# D05 deviations

What still differs from Figma after round 6 of the fidelity loop
(`pnpm fidelity inbox D05`, 2026-11-16, against the installed
library 1.0.0-beta.3, which has #97 to #102), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.5 (#104 to #106) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass.
- Position: 7 of 10 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `task pane`, `started task`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +28, RUNNING y +32),
  about half the offset of the 14 px rows.
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Started task header.** Its meta line uses `monoSm` (11/16, #102),
  Figma's 11 px, and fits on one line, so `started task` now passes
  (round 5: h +12, the 12 px `mono` line wrapped "5.5").
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie).

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
  wider: the type sizes above.
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
  larger: the type sizes.
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
  it enabled.
