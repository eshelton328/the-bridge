# D09 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity artifacts D09`, 2026-11-17, against the installed
library 1.0.0-beta.15, the version this branch pins;
checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes (2026-11-19, library 1.0.0-beta.69): the preview's
  chart draws `median 71%` (452:3706) with its dashed line through the
  library's `Thumbnail reference`. `Toolkit` is an `extra` exception (`exceptions.json`). The context
  meter's `49%` (454:366) matches with no exception, as in D07 and D08.
- Position: 23 of 35 layers pass, among them the artifact bar,
  `pill · New` (which says Updated), the title block, preview, "Made
  in", both Open in workspace buttons (`452:3634`, `452:3644`), the
  panel's `header`, `button · x`, `guard`, `message · you` and
  `model and context` and `composer · discussion`. Twelve fail, the same
  layers as in D08; each
  is listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.
- D01 to D08 give the same results as before this frame
  (`pnpm fidelity artifacts D01 … D08 --skip-build`).

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (452:3221); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 452:3221 (2026-11-19, the same decision on every page's rail).
- **Preview chart.** Figma's chart after Apply has its bars sorted from
  the lowest to the highest and a dashed amber line at the median,
  labelled `median 71%` in mono (452:3705, 452:3706). The preview is
  the library's `Thumbnail kind="chart"` with `reference={{ value: 71,
  label: 'median 71%' }}` (`applied.reference` in `changeProposed`): the
  library draws the dashed line at 71 on its own axis in
  `status.needsYou.fg` and the label in mono. The bars are the library's
  fixed sample, so they are not sorted, as in D08. The window dots
  (452:3602 to 452:3604) and the axis (452:3615) are Figma's since
  library 1.0.0-beta.74, as in D07. Library gaps "Artifact preview frame"
  and "Thumbnail colour".
- **Artifact pane and discussion panel.** `artifact pane` w +8,
  `discussion panel` x +8, w -8, as in D07 and D08: in the library's
  `DetailSplit` the artifact keeps `Container size="detail"` (828)
  against Figma's 820 pane and the panel takes the rest, up to
  `shell.discussionPane`, so it is 620 wide against 628; its 12 px start
  padding keeps the content at Figma's x 905. The 8 px is the 40 px
  inset against Figma's 36 (d-072); "Discussion panel width" is decided
  with no library change.
- **Discuss.** `button · Discuss` x -4.2, w +4.8, as in D08: `Button
  textSize="sm"` pads its sides more than Figma's. It is pressed while the
  discussion is open; since library beta.36 (#138) its border is
  `accent.discuss` (`pressedBorder="discuss"`), the solid violet, where
  Figma draws `border.discuss` at 50 %: that gives under 3:1 (WCAG
  1.4.11) over the pressed fill. Figma's violet fill has no token, so the
  fill stays `surface.selected`. Library gaps "Sort and Filter button
  widths" and "Discuss toggle".
- **Project chip.** `chips` w +4.4, `project · File in a project` x +6,
  `chip · updated 12m ago` x +7.2, as in D08: the project chip is a
  `MetaChipButton` with its chevron, and the column pads 40 against
  Figma's 36 (d-072).
- **Model and context.** Passes (218 × 26 against 220 × 22): since
  library #142 `ModelChip` is 82.2 wide against Figma's 83 and its chevron
  takes the label's tone, and "context" is `smallXs` (Regular 11/16),
  38 wide as Figma's 11 px label (454:329), in place of the 46 px wide
  `monoSm`. The chip is 26 high against 22 and the label's line 16
  against 14, on the 4 px grid (d-072). Library gap "Model chip width".
- **Discussion area.** `discussion` h -7, as in D08: `Composer` is a few
  px taller than Figma's 75 px reply box. It has no clip button (library
  gap "Attach in the discussion reply box") and no caret or violet focus
  border (library gap "Composer focus"); as in D07, its placeholder is a
  little brighter than Figma's (452:3694; library gap "Composer placeholder
  colour").
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
- **Artifact column.** The title is `headingSm` (26/36) since library
  1.0.0-beta.71 (library PR 222), its line 36 against Figma's 34, as in
  D08.
- **Apply.** D08's Apply sets `ui.discussProposal` to `applied`; with
  it the artifact shows Updated, "updated just now from the discussion"
  and the chip "updated just now", the meter 49%, and the proposal its
  applied form (`appliedView` in `screens/discussionView.ts`). The link,
  the "Made in" line and the library entry stay, as the note says.
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.

## Values picked (d-100)

Each value with no token is recorded in `LIBRARY_GAPS.md` and drawn with
the nearest library part until it lands: the applied line in `bodySm`
(Figma's 13/19 on the 4 px grid) in `fg.default` (drawn `small` in
`fg.muted` by `ProposalBlock`'s note), and, as in D08, the messages
13/20, the diff rows 28 high and 4 apart and a 12 px spark icon slot on
`ProposalBlock`. The median line and its label are the library's
`Thumbnail reference` (beta.63); no value is picked for them here.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
