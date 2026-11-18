# M05 deviations

What still differs from Figma after fix round 3 of the fidelity loop
(`pnpm fidelity artifacts M05`, 2026-11-17, against the installed library
1.0.0-beta.27; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. A run on 2026-11-18, after the phone rows' side padding and the
tool icons changed, still passes all three checks. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M5 is M1's library on the phone
with "eval" in the search (`searchPhone`): `LibraryPhone` drops the found
status and shows one `RowGroup` of the matches (no count), and each
`ArtifactRow` marks the match in its title or shows the line that matched
under its meta line, the match marked (`Highlight`).

## Checks

- Text: passes (30 strings checked; the status bar and the 27 keyboard
  keys are excluded in `frame.json`, d-089).
- Position: all 17 layers pass (`header`, `button · plus`,
  `filter · chips`, `list tools`, `408:50` (the search field; the
  keyboard's key 408:415 is named "search" too), `button · Sort`,
  `button · Filter`, `group · matches`, the three artifact rows, `tab bar`
  and the tab bar's five items).
- Rules: pass. The matches end at y 430, so nothing scrolls under the
  tab bar and no exception is needed.

## Deviations

- **Keyboard and tab bar.** Figma draws the iOS keyboard (408:360) over
  the bottom of the screen, y 553 to 844, and keeps the tab bar (408:247)
  under it, not hidden. The keyboard is the phone's own (d-089), so the
  render draws none: the space under the matches is empty and the tab bar
  shows at the bottom, where the keyboard covers it in Figma. Inbox M3
  hides its tab bar while the keyboard is open because its frame has no
  tab bar layer; M5 has one, so the render keeps it, and the tab bar's
  text and items pass the checks.
- **Row previews.** As M1: each preview is `Thumbnail size="md"`,
  76 × 48 as Figma's, drawn as D2's row drawing scaled up (library gap
  "Phone row preview drawing"). The three previews are charts, as
  Figma's (408:77, 408:298, 408:330), with brighter bars (library gap
  "Thumbnail colour").
- **Row height and New.** As M1: the rows are 70 and 82 high against
  Figma's 66 and 78 (d-072, `ListRow padding="phone"` pads 10 against
  Figma's 9), and `RowGroup`'s `mt: -2` starts each match after the
  first 2 up, so the 68 px pitch holds and each starts within 2 px of
  Figma's. Library gap "ListRow phone height 70 vs 66". New sits under
  the age against Figma's badge at the end of the meta line (408:99).
  The row's content sits 4 in from the row's sides, as
  Figma's (M1).
- **New badge.** As M1: `Badge size="xs"` with `SparkFilledIcon`, 16 high
  in Figma's teal, 51.3 wide against 48, as its star is 12 px against 9
  (408:99, 408:100). Library gap "New badge".
- **Source chips.** As M1: 6 apart against Figma's 5 (d-072), with
  Figma's 9 px sides; within the tolerance here. Library gap "Compact
  chip spacing".
- **Clear button.** The search's clear button (408:288) is `SearchField`'s
  thin grey `CloseIcon`; Figma draws it bold and bright white in the
  focused field. Library gap "Search clear button".
- **Device chrome.** The status bar (9:41), the home indicator (408:286)
  and the screen corners are not drawn (d-089); the checks measure the
  render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Group label: "3 matches", without D4's "for “eval”" and without a
  count, as Figma's `3 MATCHES` (408:294); the header is 2 under the
  search row, where M1 has the found status.
- Match line: a description match shows the state's excerpt
  (`search.excerpts`, "…the cold-reader eval of the readme skill…",
  408:328), a link match the link (408:358); a title match marks the
  title and adds no line (408:92). A project match adds no line.
- Writer cross-family round: its preview is a chart in M5 (408:330) and a
  doc in D4 (403:8280); `searchPhone` sets the chart.
- Focus: the story focuses the search, as Figma draws it with the focus
  border.

## Fix rounds

Round 1 put the match line on one line and named the search field by its
node id. Round 2 set the matches 0 apart. Round 3 took two runs: a
comment change, then a fix for a regression it showed in M1 (an empty
`ListRow` line on every phone row, which made M1's rows from the second
on fail); M1 is back to its one failing layer, `filter · chips`. A last
run after that changed only a code comment and the page's AGENTS.md, so
the render is the same.
