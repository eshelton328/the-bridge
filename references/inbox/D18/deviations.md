# D18 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D18`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; SNOOZED and its count, which the toast covers in Figma, are excepted in `exceptions.json`.
- Position: 9 of 17 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `toast · created`, `task pane`, `task bar`, `title block`).
- Rules: pass; the overflow of the list's `section` is excepted in `exceptions.json` (see "List height").

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +18, SNOOZED y +38).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **New rows.** Figma draws the three new tasks as bordered boxes on a
  raised fill (403:2901). `ListRow` has no state for a new row (library
  gap); the rows are plain, with a `StatusPill tone="running"` "New" with
  a dot under the meta line, as Figma's pill.
- **Toast.** The library's `Toast tone="discuss"` with a check and Undo,
  12 px in and 16 px up from the list's bottom (`toast · created`
  passes).
- **List height.** The scrolling list ends at the toast's bottom edge
  (y 966): the pane (`inbox list`, full height) pads 16 px under it, so
  nothing shows below the toast, as in Figma. With the taller rows the
  list is 26 px taller than that area. The collapsed SNOOZED header
  (y 954 to 992) is behind the toast and past the list's edge; in Figma
  the toast covers it (y 930, toast y 928 to 966), so it is out of sight
  in both. `exceptions.json` excepts the `hiddenOverflow` finding of the
  list's `section` and SNOOZED and its count. The rows also put
  "Commit the brain: 34 changes" 38 px lower than Figma's, so the toast
  covers its meta line, where Figma shows the whole row.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +15, start y +26, MY NOTES y +27, SOURCES y +45.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D18.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Toast covers the last row's meta line: recorded. The library rows are 3 px taller and the group headers 4 px (List row heights), so "Commit the brain: 34 changes" sits 38 px lower than Figma's and its meta line is under the toast. The app sets none of those heights.
- Cut SNOOZED header below the toast: fixed. The scrolling list now ends at the toast's bottom edge (the pane pads 16 under it), so nothing shows below the toast, as in Figma. `exceptions.json` now names the list's `section` and says why the header is out of sight in both.
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Needs-you row actions (Allow once, Deny, Open chat) larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size".
- RUN IN card 73 against 62 px: in part. Its title is now 13 px; the card keeps the `Panel` padding and the `sm` button height.
- Newest and Filter wider, Search narrower: recorded. Newest and Filter are `Button`s with 14 px labels against Figma's Medium 13 (403:1663, 403:1671), so they are wider and Search takes what is left (row "Button label size").
- Rail items further apart: recorded. The library `NavRail` items are 54 px high and 60 px apart against Figma's 50 and 56 (More y 241 against 233). D01 to D12 render the same rail. LIBRARY_GAPS.md, row "Rail item height".
- Task title smaller: recorded. Figma's title is Geist SemiBold 22/28 (403:1809). No text style has 22 px (`title` is 20, `heading` 28), so the title is in `title`. LIBRARY_GAPS.md, row "22 px title".
- Links brighter blue: no change. The links are `fg.accent`, Figma's #5ee1ff; at the larger size they looked brighter. They are now Figma's 12 px.
