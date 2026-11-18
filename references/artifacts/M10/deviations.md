# M10 deviations

What still differs from Figma after the review fix round of the
fidelity loop (`pnpm fidelity artifacts M10`, 2026-11-18, against the
installed
library 1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M10 is D8's proposed update
(`../D08/deviations.md`) on M9's discussion page (`../M09/deviations.md`),
as T5 is on T4's (`../T05/deviations.md`): the same nav, card and reply
box as M9, with D8's question, reply and proposal in place of the empty
state. All three checks render the page 38 px shorter, below Figma's
status bar (d-102), and the position check adds 38 to each render y.

## Checks

- Text: passes. Nothing is missing, hidden or extra, with no exception.
- Position: 5 of 13 layers pass (`nav`, `452:4181` (Open in workspace),
  `pill · New`, `chevron · open artifact` and `composer · discussion`).
  Eight fail: `artifact · discussing`, `model and context`, `guard`,
  `discussion`, `message · you`, `message · discussion`,
  `proposal · UPDATE THIS ARTIFACT` and `diff · CHART`; see below.
- Rules: pass. The entries fit between the card and the reply box with
  no scroll.

## Deviations

- **Artifact card height.** `artifact · discussing` h +9 (162 against
  153), and so `guard` y +5, as in M9: the meta line and the guard's
  lines are 16 px (`monoSm`, on the 4 px grid, d-072) against Figma's 14
  and 15, the model chip is 26 high against 22 (454:428), and `Panel
  variant="notice"` pads 10 and 12 against Figma's 11 and 13. Library
  gap "Model chip width" and the 4 px grid (d-072).
- **Card title.** "Skill eval pass rates" is `paneTitle` (SemiBold
  15/20), so it is 141 px wide against Figma's 132 (452:4117, about
  SemiBold 14 in an 18 px line), as in M9. The library has no SemiBold
  14 text style: `label` is Medium 14 and `paneTitle` SemiBold 15.
  Library gap "Discussed artifact title size".
- **Model and context.** `model and context` w +6.2 (226 against 220):
  `ModelChip` pads its sides more than Figma's 83 px picker, as in D7,
  T4 and M9. Library gap "Model chip width".
- **Discussion area.** `discussion` y +9, h -112: the area starts 9
  lower because the card above is 9 taller. Figma's `discussion` frame
  (452:4130) holds the reply box too, down to y 811. The page keeps the
  reply box in the shared `DetailFrame`'s sticky footer, so it stays at
  the bottom while the messages scroll (d-107); the element marked
  `discussion` is the messages' area only, as on T5 and M9. The reply
  box itself (`composer · discussion`) passes.
- **Entries lower.** `message · you` y +7, `message · discussion` y +9,
  `proposal · UPDATE THIS ARTIFACT` y +11 and `diff · CHART` y +13: the
  card is 9 taller, the first entry is 12 under the area's top (Figma 14,
  on the 4 px grid), and each message is 2 taller than Figma's (below),
  so each entry starts a little lower than the one above it. The entries
  are 12 apart, as Figma's.
- **Messages.** As in D8 and T5: Erik's message is `Message from="user"`
  in 14/20 against Figma's 13/19 (452:4132), so it is 60 high against
  58, and its first line wraps one word earlier: it ends "and sort",
  where Figma's ends "and sort the", so "the" starts the second line.
  The reply is composed in the page (a violet 12 px bubble,
  "Discussion" in `labelXsStrong`, the text in `bodySm`, 62 against
  60). Library gap "Message author icon and small text".
- **Proposal block.** `proposal · UPDATE THIS ARTIFACT` h +7 and
  `diff · CHART` h +5, as in D8 and T5: no spark icon before the eyebrow
  (452:4141), and `ProposalDiff` draws its rows a few px taller than
  Figma's 27 px rows, so the diff is 112 high against 107 and the block
  206 against 199. Library gap "Proposal block icon and diff rows".
- **Reply box.** As in M9: no clip button (452:4172, library gap
  "Attach in the discussion reply box"), no caret (452:4170) or violet
  focus border (library gap "Composer focus"), and a placeholder a
  little brighter than Figma's (452:4169, library gap "Composer
  placeholder colour").
- **Home indicator and the area under the reply box.** As in M9: the
  app draws no home indicator (d-089), and the reply box's footer is
  opaque (`bg.canvas`) over the backdrop's stars.
- **Buttons of the proposal.** Apply sets `ui.discussProposal` to
  `applied` and closes the page (`proposalEffect(…, 'page')`), as on the
  tablet (T5): the artifact's page (M2) shows Updated and "updated just
  now from the discussion", and Discuss reopens the discussion with the
  applied proposal and no buttons (D9's applied form, context 49%). The
  note says only that Apply republishes to the same link, which the
  link on M2 keeps; no phone frame draws the applied state. Discard drops
  the proposal; Edit first puts the two added lines in the reply box, as
  in D8. Open in workspace has no action (no workspace route).

## Values picked (d-100)

- Apply on the phone: Apply closes the discussion page and returns to
  the artifact's page (M2), as Apply on the tablet returns to T2 (T5).
  M2 then shows Updated and "updated just now from the discussion", and
  Discuss reopens the discussion with the applied proposal. Figma's
  note does not say otherwise.
- The first entry 12 under the discussion area's top (Figma 14, on the
  4 px grid); the entries 12 apart, as Figma's. The entries take the
  page's full 366 px, as Figma's.
- Everything else as M9 (page sides 12, nav, card, reply box) and D8
  (message and diff sizes).
