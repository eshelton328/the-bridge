# D09 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity artifacts D09`, 2026-11-17, against the installed
library 1.0.0-beta.10, the version this branch pins), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: fails on one string. `median 71%` (452:3706) is missing: the
  preview's chart has no median line or label (see Preview chart below).
  `Toolkit` is an `extra` exception and the context meter's `49%`
  (454:366) a `missing` exception (`exceptions.json`): the meter shows
  49%, but `ContextMeter` draws the number and the % sign as two text
  nodes, which the text check cannot match, as in D07 and D08.
- Position: 18 of 29 layers pass, among them the artifact bar,
  `pill · New` (which says Updated), the title block, preview, "Made
  in", both Open in workspace buttons (`452:3634`, `452:3644`), the
  panel's `header`, `button · x`, `guard`, `message · you` and
  `composer · discussion`. Eleven fail, the same layers as in D08; each
  is listed below.
- Rules: pass.
- D01 to D08 give the same results as before this frame
  (`pnpm fidelity artifacts D01 … D08 --skip-build`).

## Deviations

- **Preview chart.** Figma's chart after Apply has its bars sorted from
  the lowest to the highest and a dashed amber line at the median,
  labelled `median 71%` in mono (452:3705, 452:3706). The preview is
  the library's `Thumbnail kind="chart"`, a fixed sample chart in the
  library's colours, and no chart of the library draws a reference
  line, so the render shows the same bars as D08 and no median line or
  label. Library gaps "Artifact preview frame" and "Thumbnail colour".
- **Artifact pane and discussion panel.** `artifact pane` w +8,
  `discussion panel` x +8, w -8, as in D07 and D08: the artifact keeps
  `Container size="detail"` (828) against Figma's 820 pane, so the panel
  is 620 wide against 628; its 12 px start padding keeps the content at
  Figma's x 905. Library gaps "Discussion panel width" and "Detail column
  inset".
- **Discuss.** `button · Discuss` x -4.2, w +4.8, as in D08: `Button
  textSize="sm"` pads its sides more than Figma's. It is pressed, but
  cyan where Figma draws it violet. Library gaps "Sort and Filter button
  widths" and "Discuss toggle".
- **Project chip.** `chips` w -13.6, `project · File in a project` x +6,
  w -16.8, `chip · updated 12m ago` x -10.8, as in D08: the project chip
  is a read-only `MetaChip` with no chevron. Library gap "Project chip
  menu".
- **Model and context.** `model and context` w +10: `ModelChip` pads its
  sides more than Figma's 83 px picker. Library gap "Model chip width".
- **Discussion area.** `discussion` h -7, as in D08: `Composer` is a few
  px taller than Figma's 75 px reply box. It has no clip button (library
  gap "Attach in the discussion reply box") and no caret or violet focus
  border (library gap "Composer focus").
- **Messages.** Erik's message is `Message from="user"`, 14/20 against
  Figma's 13/19, so the reply starts lower (`message · discussion` y
  +5), as in D08. Library gap "Message author icon and small text".
- **Applied proposal.** `proposal · applied` y +7, h +3 and
  `diff · CHART` y +9, h +4: the block starts lower because of the
  messages above it, and `ProposalDiff` draws its rows a few px taller
  than Figma's 27 px rows. The block has no spark icon before its
  eyebrow (452:3667), and the applied line "Applied just now.
  Republished to the same link, …" is the block's `note`, in `small`
  (12/16) and `fg.muted`, where Figma sets it in Regular 13/19 in the
  default text colour (452:3704). The applied block shows only the two
  lines Apply put in and no buttons, as Figma's. Library gap "Proposal
  block icon and diff rows".
- **Artifact column.** The title is 28 px type against about 26, as in
  D08. Library gap "Artifact title size".
- **Apply.** D08's Apply sets `ui.discussProposal` to `applied`; with
  it the artifact shows Updated, "updated just now from the discussion"
  and the chip "updated just now", the meter 49%, and the proposal its
  applied form (`appliedView` in `screens/discussionView.ts`). The link,
  the "Made in" line and the library entry stay, as the note says.
- **Rail.** The shared rail (`AppRail`, not changed here) has a Toolkit
  item after Artifacts (d-105), which this frame does not draw, so More
  sits one item lower, and its items are 54 high and 60 apart against
  Figma's 50 and 56. Library gap "Rail item height".

## Values picked (d-100)

Each value with no token is recorded in `LIBRARY_GAPS.md` and drawn with
the nearest library part until it lands: the applied line in `bodySm`
(Figma's 13/19 on the 4 px grid) in `fg.default` (drawn `small` in
`fg.muted` by `ProposalBlock`'s note), and, as in D08, the messages
13/20, the diff rows 28 high and 4 apart and a 12 px spark icon slot on
`ProposalBlock`. The median line and its label wait for a library chart
with a reference line; no value is picked for them here.
