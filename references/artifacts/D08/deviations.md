# D08 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity artifacts D08`, 2026-11-17, against the installed
library 1.0.0-beta.15, the version this branch pins;
checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception (`exceptions.json`).
  The context meter's `48%` (454:347) matches with no exception, as in
  D07.
- Position: 23 of 35 layers pass, among them the artifact bar, title
  block, preview, "Made in", both Open in workspace buttons (`452:3016`,
  `452:3082`), the panel's `header`, `button · x`, `guard`,
  `message · you`, `model and context` and `composer · discussion`.
  Twelve fail; each is
  listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.
- D01 to D07 give the same results as before this frame
  (`pnpm fidelity artifacts D01 … D07 --skip-build`).

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (452:2603); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 452:2603 (2026-11-19, the same decision on every page's rail).
- **Artifact pane and discussion panel.** `artifact pane` w +8,
  `discussion panel` x +8, w -8, as in D07: the artifact keeps
  `Container size="detail"` (828) against Figma's 820 pane, so the panel
  is 620 wide against 628; its 12 px start padding keeps the content at
  Figma's x 905. Library gap "Discussion panel width"; the 40 px inset is
  d-072.
- **Discuss.** `button · Discuss` x -4.2, w +4.8, as in D07: `Button
  textSize="sm"` pads its sides more than Figma's. It is pressed while the
  discussion is open; since library beta.36 (#138) its border is
  `accent.discuss` (`pressedBorder="discuss"`), the solid violet, where
  Figma draws `border.discuss` at 50 %: that gives under 3:1 (WCAG
  1.4.11) over the pressed fill. Figma's violet fill has no token, so the
  fill stays `surface.selected`. Library gaps "Sort and Filter button
  widths" and "Discuss toggle".
- **Project chip.** `chips` w +5.2, `project · File in a project` x +6,
  `chip · updated 12m ago` x +7.2, as in D07: the project chip is a
  `MetaChipButton` with its chevron, and the column pads 40 against
  Figma's 36 (d-072).
- **Model and context.** Passes (218 × 26 against 220 × 22): since
  library #142 `ModelChip` is 82.2 wide against Figma's 83 and its chevron
  takes the label's tone, and "context" is `smallXs` (Regular 11/16),
  38 wide as Figma's 11 px label (454:329), in place of the 46 px wide
  `monoSm`. The chip is 26 high against 22 and the label's line 16
  against 14, on the 4 px grid (d-072). Library gap "Model chip width".
- **Discussion area.** `discussion` h -7, as in D07: `Composer` is a few
  px taller than Figma's 75 px reply box. It has no clip button (library
  gap "Attach in the discussion reply box") and no caret or violet focus
  border (library gap "Composer focus"); as in D07, its placeholder is a
  little brighter than Figma's (452:3072; library gap "Composer placeholder
  colour").
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
- **Artifact column.** The title is `headingSm` (26/36) since library
  1.0.0-beta.71 (library PR 222), its line 36 against Figma's 34, as in
  D2. The preview's bars are the library's chart drawing in its colours, not
  Figma's heights and colours. Its window dots (452:2984 to 452:2986) and
  axis (452:2997) are Figma's since library 1.0.0-beta.74, as in D07.
  Library gaps "Thumbnail colour" and "Artifact preview frame".
- **Buttons of the proposal.** Discard drops the proposal from the
  discussion. Apply sets `ui.discussProposal` to `applied`, which shows
  D09: the artifact's pill says Updated, its bar "updated just now from
  the discussion" and its chip "updated just now", the context meter 49%,
  and the proposal its applied form with no buttons. Edit first puts the
  two lines the proposal adds in the reply box, for Erik to change and
  send; no frame designs an editor for an artifact change. Open in
  workspace still has no action (no workspace route).
- **Discussion blocks.** The Inbox page does not export its
  `ProposalCard` and discussion entries, so the Artifacts page has its
  own `ArtifactProposal` and `DiscussionEntry`, built from the same
  library parts (`ProposalBlock`, `ProposalDiff`, `Message`,
  `BubbleIcon`). Nothing moved into `web/src/blocks/`.
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.

## Values picked (d-100)

Each value with no token is recorded in `LIBRARY_GAPS.md` and drawn with
the nearest library part until it lands: the reply text 13/20
(`bodySm`; Figma's 13/19 on the 4 px grid), the messages 13/20 (drawn
14/20 by `Message`), the diff rows 28 high and 4 apart (Figma's 27 on
the 4 px grid; drawn by `ProposalDiff`), and a 12 px spark icon slot on
`ProposalBlock` (drawn without it). The panel keeps D07's paddings and
its entries are 12 apart, 6 below the guard, as Figma's.
