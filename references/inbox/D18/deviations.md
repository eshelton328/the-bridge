# D18 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D18`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; SNOOZED and its count, which the toast covers in Figma, are excepted in `exceptions.json`.
- Position: 15 of 23 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `group · SNOOZED`, `toast · created`, `task pane`, `task bar`, `title block`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass; the overflow of the list's `section` is excepted in `exceptions.json` (see "List height").

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55: the 4 px
  grid value nearest Figma's (d-100, library #108). The groups below the
  first start within the 4 px tolerance (NEXT STEPS and SNOOZED pass).
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header): the 4 px grid value nearest Figma's (d-100, library #108). The
  label's centre is 20 px from the header's top (Figma 21).
- **New rows.** Figma draws the three new tasks as bordered boxes on a
  raised fill (403:2901). `ListRow` has no state for a new row (library
  gap); the rows are plain, with a `StatusPill tone="running"` "New" with
  a dot under the meta line, as Figma's pill.
- **Toast.** The library's `Toast tone="discuss"` with a check and Undo,
  12 px in and 16 px up from the list's bottom (`toast · created`
  passes). Undo takes the three new tasks out of Next steps, with the
  counts and the toast (the Inbox route tests): the state names the rows
  it draws as created, since Figma's task here has no discussion to
  apply, and its `ui` has the tasks created.
- **List height.** The scrolling list ends at the toast's bottom edge
  (y 966): the pane (`inbox list`, full height) pads 16 px under it, so
  nothing shows below the toast, as in Figma. The list scrolls 28 px
  (scrollHeight 994, clientHeight 966): the toast's own height is in the
  scroll area. The collapsed SNOOZED header (group at Figma's y 916,
  within the tolerance) is behind the toast (y 928 to 966), as in Figma,
  so it is out of sight in both. `exceptions.json` excepts the
  `hiddenOverflow` finding of the list's `section` and SNOOZED and its
  count. "Commit the brain: 34 changes" sits within the tolerance of
  Figma's row, so its meta line shows above the toast, as in Figma.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21
  px apart and its mono boxes 14 px high; the library keeps 20 and 16 (4
  px grid). The prompt's five lines hold all of it, so it does not fade
  where Figma fades its fifth line (`section · SUGGESTED PROMPT` h -2).
  Since beta.5 the prompt's `bodySm` sits on a block around `Clamp`, not
  on an inline span: there its 13 px text in the panel's 14 px line made
  21 px lines, and the faded `Clamp` (#104), which now cuts at five
  lines' height with no ellipsis, would hide the fifth. Five 20 px lines
  are 100 px, not 105, so the prompt is 5 px shorter and the layers
  below it 5 px higher.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +10, start y +13, MY NOTES y +14, SOURCES y +28.
- **Button labels.** Allow once, Deny and Open chat in the approval row,
  Snooze and Dismiss in the task bar, Reset and Edit in the prompt
  section and Change in the run card are `textSize="xs"` (`labelXs`,
  Medium 12/16), and Start is `textSize="smStrong"` (`labelSmStrong`,
  SemiBold 13/16), as Figma's. The labels match Figma's in this frame.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
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
  x +0, y +18, w +1, h +4); `group · SNOOZED` within tolerance (was x
  +0, y +38, w +1, h +4). The cause is #108's compact `ListRow` (56
  px, was 58; Figma 55) and list `GroupHeader` (36 px, was 38; Figma
  34).
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

The blind second review of round 3 (`reports/fidelity/inbox/D18.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Toast covers the last row's meta line: recorded. The library rows are 3 px taller and the group headers 4 px (List row heights), so "Commit the brain: 34 changes" sits 38 px lower than Figma's and its meta line is under the toast. The app sets none of those heights. Fixed by beta.7: with 56 px rows and 36 px headers (#108) the row is within the tolerance and its meta line shows above the toast.
- Cut SNOOZED header below the toast: fixed. The scrolling list now ends at the toast's bottom edge (the pane pads 16 under it), so nothing shows below the toast, as in Figma. `exceptions.json` now names the list's `section` and says why the header is out of sight in both.
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Needs-you row actions (Allow once, Deny, Open chat) larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size". Since beta.7 they take `textSize="xs"`, Figma's (see Button labels).
- RUN IN card 73 against 62 px: in part. Its title is now 13 px; the card keeps the `Panel` padding and the `sm` button height.
- Newest and Filter wider, Search narrower: recorded. Newest and Filter
  are `Button`s with 14 px labels against Figma's Medium 13 (403:1663,
  403:1671), so they are wider and Search takes what is left (row
  "Button label size"). Fixed by beta.5: Newest and Filter take
  `Button textSize="sm"` (Medium 13) and the search field
  `SearchField textSize="sm"` (13 px).
- Rail items: library #115 (beta.14) closed the gap. `NavRail` items are 50 px high and 56 px apart, as Figma's.
- Task title smaller: recorded. Figma's title is Geist SemiBold 22/28 (403:1809). No text style has 22 px (`title` is 20, `heading` 28), so the title is in `title`. LIBRARY_GAPS.md, row "22 px title".
- Links brighter blue: no change. The links are `fg.accent`, Figma's #5ee1ff; at the larger size they looked brighter. They are now Figma's 12 px.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
