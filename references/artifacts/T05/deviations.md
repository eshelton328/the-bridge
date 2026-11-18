# T05 deviations

What still differs from Figma after round 1 of the fidelity loop (`pnpm
fidelity artifacts T05`, 2026-11-17, against the installed library
1.0.0-beta.19; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
T5 is D8's proposed update (`../D08/deviations.md`) on T4's discussion
page (`../T04/deviations.md`): the same nav, card and reply box, with D8's
question, reply and proposal in place of the empty state. All three checks
render the page 29 px shorter, below Figma's status bar (d-102), and the
position check adds 29 to each render y.

## Checks

- Text: passes. Nothing is missing, hidden or extra, with no exception.
- Position: 8 of 13 layers pass (`nav`, `452:3978` (Open in workspace),
  `artifact · discussing`, `pill · New`, `chevron · open artifact`,
  `guard`, `model and context` and `composer · discussion`). Five fail;
  see below.
- Rules: pass.
- D01 to D09 and T01 to T04 give the same results as before this frame
  (`pnpm fidelity artifacts D01 … T04 --skip-build`), with the same
  position deltas.

## Deviations

- **Model and context.** Passes (218 × 26 against 220 × 22): since
  library #142 `ModelChip` is 82.2 wide against Figma's 83 and its chevron
  takes the label's tone, and "context" is `smallXs` (Regular 11/16),
  38 wide as Figma's 11 px label (454:329), in place of the 46 px wide
  `monoSm`. The chip is 26 high against 22 and the label's line 16
  against 14, on the 4 px grid (d-072). Library gap "Model chip width".
- **Discussion area.** `discussion` h -121, as in T4: Figma's
  `discussion` frame (452:3927) holds the reply box too, down to y 1125.
  The page keeps the reply box in the shared `DetailFrame`'s sticky
  footer, so it stays at the bottom while the messages scroll (d-107);
  the element marked `discussion` is the messages' area only. The reply
  box itself (`composer · discussion`) passes.
- **Entries column.** `message · you` w +148, `message · discussion`
  w +148, h -18, `proposal · UPDATE THIS ARTIFACT` y -15, w +148, h +7
  and `diff · CHART` y -13, w +148, h +5: Figma sets the messages and
  the proposal in a 560 px column at the start of the page. No size
  token is 560, so they take the page's 708 px, as T4's "It can" panel
  and the Inbox's tablet discussion (Inbox T17). The wider reply wraps
  to one line against Figma's two, so the proposal starts 15 px higher.
  Library gap "Empty state with an icon tile" (its value to add: the 560
  discussion column).
- **Messages.** As in D8: Erik's message is `Message from="user"` in
  14/20 against Figma's 13/19; the reply is composed in the page (a
  violet 12 px bubble, "Discussion" in `labelXsStrong`, the text in
  `bodySm`). Library gap "Message author icon and small text".
- **Proposal block.** As in D8: no spark icon before the eyebrow
  (452:3938), and `ProposalDiff` draws its rows a few px taller than
  Figma's 27 px rows, so the diff is 5 px taller and the block 7.
  Library gap "Proposal block icon and diff rows".
- **Reply box.** As in T4: no clip button (452:3969, library gap
  "Attach in the discussion reply box"), no caret (452:3967) or violet
  focus border (library gap "Composer focus"), and a placeholder a
  little brighter than Figma's (452:3966, library gap "Composer
  placeholder colour").
- **Reply box height.** `composer · discussion` is 708 × 78 against
  Figma's 712 × 75 (452:3964), within the tolerance (h +3): the
  placeholder's line is the TextField's 20 px against Figma's 17
  (452:3966). Library gap "Composer height".
- **Card.** As in T4: `Panel variant="notice"` makes the card 100 high
  against 96, so the discussion area starts 4 lower.
- **Home indicator and the area under the reply box.** As in T4: the
  app draws no home indicator (d-089), and the reply box's footer is
  opaque (`bg.canvas`) over the backdrop's stars.
- **Buttons of the proposal.** Apply sets `ui.discussProposal` to
  `applied` and closes the page (`proposalEffect(…, 'page')`), so the
  artifact's page (T2) shows Updated, "updated just now from the
  discussion" and the chip "updated just now", as D9 does on the
  desktop; Discuss reopens the discussion with the applied proposal and
  no buttons (D9's applied form, context 49%). No tablet frame draws the
  applied discussion. Discard drops the proposal; Edit first puts the
  two added lines in the reply box, as in D8. Open in workspace has no
  action (no workspace route).

## Values picked (d-100)

- The first entry 12 under the discussion area's top (Figma 14, on the
  4 px grid); the entries 12 apart, as Figma's. The empty state (T4)
  keeps its 32.
- The entries column: the page's 708 px until the library has a 560
  discussion column (Figma's value, on the 4 px grid).
- Everything else as T4 (page sides 24, nav, card, reply box) and D8
  (message and diff sizes).
