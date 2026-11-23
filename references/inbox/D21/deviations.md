# D21 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D21`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; the hidden Snooze, Dismiss, Reset and Edit are excepted in `exceptions.json`.
- Position: 12 of 20 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `group · TODAY`, `group · YESTERDAY`, `task pane`, `task bar`, `title block`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 56 px against Figma's 55: the 4 px
  grid value nearest Figma's (d-100, library #108). YESTERDAY starts
  within the 4 px tolerance.
- **Group headers.** 36 px high against Figma's 34 (`h +2` on each group
  header): the 4 px grid value nearest Figma's (d-100, library #108). The
  label's centre is 20 px from the header's top (Figma 21).
- **Removed row.** The outcome line has a bin and is `status.danger.fg`,
  as Figma's red line.
- **Removed task.** The status pill is `danger` "Removed", the prompt
  heading "Prompt · not run" with no buttons, and the card that shows
  how it ended is `RunCard` (`result card`) with a `danger` pill, Open
  discussion and Restore. Its `Panel tone="danger"` draws the red border
  (`status.danger.border`), as Figma's. It starts 14 px lower, from the
  offsets above.
- **Done rows.** As in D07: the kind tile of a finished row fades to
  `opacity.finished` 0.75 (library #107), where Figma fades it to 0.6:
  at 0.6 the icons fall to 2.4:1 in light mode, under AA's 3:1 (d-100
  rule 2).
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
  lower: RESULT CARD y +14, MY NOTES y +17, SOURCES y +31.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Hidden Figma text.** Figma keeps Snooze and Dismiss in the task bar
  and Reset and Edit in the prompt header as hidden layers;
  `exceptions.json` excepts them, as in D07.
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
  in `textSize="smStrong"` (SemiBold 13), as T4 sets Reply here in Figma
  (346:6297). Restore is `textSize="sm"` (Medium 13), the type read
  from Figma (403:4282, d-106); no layer of this frame moved.
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
  shorter: `section · MY NOTES` y +11 px (was y +11, h +12 px); `section · SOURCES` y +17 px (was y +25 px). The y offsets that stay come from the section
  gaps and line heights above (4 px grid, d-072, d-100).

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D21.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Newest and Filter wider, Search narrower: recorded. Newest and Filter
  are `Button`s with 14 px labels against Figma's Medium 13 (403:1663,
  403:1671), so they are wider and Search takes what is left (row
  "Button label size"). Fixed by beta.5: Newest and Filter take
  `Button textSize="sm"` (Medium 13) and the search field
  `SearchField textSize="sm"` (13 px).
- Rail items: library #115 (beta.14) closed the gap. `NavRail` items are 50 px high and 56 px apart, as Figma's.
- Tag chips larger and whiter: colour fixed. The chips are now `MetaChip tone="muted"` (Figma #8a97b8, `fg.muted`); the NCC chip keeps `tone="issue"`. Their widths match Figma's within 1 px (88.8, 141.6 and 75.6 against 88, 141 and 75); they are 26 px high against 24 because `monoSm` keeps a 16 px line on the 4 px grid (d-072).

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and
  the title "Workspaces is not built yet", keeps the focus and does
  nothing on a press (the Inbox route tests); since beta.5 (#105) a
  disabled secondary `Button` no longer fades: it keeps its fill and
  border and only its label and icon turn `fg.muted`, where Figma draws
  it enabled.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
