# D08 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity artifacts D08`, 2026-11-17, against the installed
library 1.0.0-beta.10, the version this branch pins), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception and the context
  meter's `48%` (454:347) a `missing` exception (`exceptions.json`): the
  meter shows 48%, but `ContextMeter` draws the number and the % sign as
  two text nodes, which the text check cannot match, as in D07.
- Position: 18 of 29 layers pass, among them the artifact bar, title
  block, preview, "Made in", both Open in workspace buttons (`452:3016`,
  `452:3082`), the panel's `header`, `button · x`, `guard`,
  `message · you` and `composer · discussion`. Eleven fail; each is
  listed below.
- Rules: pass.
- D01 to D07 give the same results as before this frame
  (`pnpm fidelity artifacts D01 … D07 --skip-build`).

## Deviations

- **Artifact pane and discussion panel.** `artifact pane` w +8,
  `discussion panel` x +8, w -8, as in D07: the artifact keeps
  `Container size="detail"` (828) against Figma's 820 pane, so the panel
  is 620 wide against 628; its 12 px start padding keeps the content at
  Figma's x 905. Library gaps "Discussion panel width" and "Detail column
  inset".
- **Discuss.** `button · Discuss` x -4.2, w +4.8, as in D07: `Button
  textSize="sm"` pads its sides more than Figma's. It is pressed, but
  cyan where Figma draws it violet. Library gaps "Sort and Filter button
  widths" and "Discuss toggle".
- **Project chip.** `chips` w -12.8, `project · File in a project` x +6,
  w -16.8, `chip · updated 12m ago` x -10.8, as in D07: the project chip
  is a read-only `MetaChip` with no chevron. Library gap "Project chip
  menu".
- **Model and context.** `model and context` w +10: `ModelChip` pads its
  sides more than Figma's 83 px picker. Library gap "Model chip width".
- **Discussion area.** `discussion` h -7, as in D07: `Composer` is a few
  px taller than Figma's 75 px reply box. It has no clip button (library
  gap "Attach in the discussion reply box") and no caret or violet focus
  border (library gap "Composer focus").
- **Messages.** Erik's message is `Message from="user"`, whose text is
  14/20 against Figma's 13/19, so its box is a few px taller and the
  reply starts lower (`message · discussion` y +5). The reply is composed
  in the page: a violet 12 px bubble, "Discussion" in `labelXsStrong`
  and the text in `bodySm` (13/20 against 13/19). Library gap "Message
  author icon and small text".
- **Proposal block.** `proposal · UPDATE THIS ARTIFACT` y +7, h +7 and
  `diff · CHART` y +9, h +5: the block starts lower because of the
  messages above it, and `ProposalDiff` draws its rows a few px taller
  than Figma's 27 px rows 4 apart. The block has no spark icon before
  its eyebrow, which Figma draws (452:3045). Library gap "Proposal block
  icon and diff rows".
- **Artifact column.** The title is 28 px type against about 26, and the
  preview's bars are the library's chart drawing in its colours, not
  Figma's heights and colours, as in D07. Library gaps "Artifact title
  size", "Thumbnail colour" and "Artifact preview frame".
- **Buttons of the proposal.** Discard drops the proposal from the
  discussion. Apply sets `ui.discussProposal` to `applied`, which shows
  D09: the artifact's pill says Updated, its bar "updated just now from
  the discussion" and its chip "updated just now", the context meter 49%,
  and the proposal its applied form with no buttons. Edit first puts
  the two lines the proposal adds in the reply box, for Erik to change and send; no frame designs
  an editor for an artifact change. Open in workspace still has no
  action (no workspace route).
- **Discussion blocks.** The Inbox page does not export its
  `ProposalCard` and discussion entries, so the Artifacts page has its
  own `ArtifactProposal` and `DiscussionEntry`, built from the same
  library parts (`ProposalBlock`, `ProposalDiff`, `Message`,
  `BubbleIcon`). Nothing moved into `web/src/blocks/`.
- **Rail.** The shared rail (`AppRail`, not changed here) has a Toolkit
  item after Artifacts (d-105), which this frame does not draw, so More
  sits one item lower, and its items are 54 high and 60 apart against
  Figma's 50 and 56. Library gap "Rail item height".

## Values picked (d-100)

Each value with no token is recorded in `LIBRARY_GAPS.md` and drawn with
the nearest library part until it lands: the reply text 13/20
(`bodySm`; Figma's 13/19 on the 4 px grid), the messages 13/20 (drawn
14/20 by `Message`), the diff rows 28 high and 4 apart (Figma's 27 on
the 4 px grid; drawn by `ProposalDiff`), and a 12 px spark icon slot on
`ProposalBlock` (drawn without it). The panel keeps D07's paddings and
its entries are 12 apart, 6 below the guard, as Figma's.
