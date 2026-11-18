# M09 deviations

What still differs from Figma after fix round 3 of the fidelity loop
(`pnpm fidelity artifacts M09`, 2026-11-18, against the installed
library 1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M9 is T4's discussion page
(`../T04/deviations.md`) on the phone (`screens/ArtifactDiscussionPage.tsx`,
`layout="phone"`), in the place of M2's artifact page, with no tab bar, as
the Inbox's M18. All three checks render the page 38 px shorter, below
Figma's status bar (d-102), and the position check adds 38 to each render
y.

## Checks

- Text: passes. Nothing is missing, hidden or extra, with no exception.
- Position: 7 of 12 layers pass (`nav`, `452:4076` (Open in workspace),
  `pill · New`, `chevron · open artifact`, `it can`, `suggestions` and
  `composer · discussion`). Five fail: `artifact · discussing`,
  `model and context`, `guard`, `discussion` and `empty state`; see below.
- Rules: pass. The empty state fits between the card and the reply box
  with no scroll.

## Deviations

- **Artifact card height.** `artifact · discussing` h +9 (162 against
  153), and so `guard` y +5. The card's rows are taller than Figma's:
  the meta line and the guard's lines are 16 px (`monoSm`, on the 4 px
  grid, d-072) against Figma's 14 and 15 (452:4026, 452:4031), and the
  model chip is 26 high against Figma's 22 (454:409). `Panel
  variant="notice"` pads 10 and 12 against Figma's 11 and 13, and its rows
  are 4 apart against 5. Library gap "Model chip width" (its M9 note) and
  the 4 px grid (d-072).
- **Model and context.** `model and context` w +6.2 (226 against 220):
  `ModelChip` pads its sides more than Figma's 83 px picker, as in D7 and
  T4. Library gap "Model chip width".
- **Discussion area.** `discussion` y +9, h -112: the area starts 9 lower
  because the card above is 9 taller. Figma's `discussion` frame
  (452:4032) holds the reply box too, down to y 811. The page keeps the
  reply box in the shared `DetailFrame`'s sticky footer, so it stays at
  the bottom while the messages scroll (d-107), and the element marked
  `discussion` is the messages' area only, as on T4. The reply box itself
  (`composer · discussion`) passes.
- **Empty state.** `empty state` y +19, h +245: Figma's `empty state`
  frame (452:4033) starts 28 above its tile and holds the tile, the title
  and the text; "It can" (452:4039) and the suggestions (452:4053) are
  frames beside it. The library-built `DiscussionEmpty`, shared with D7
  and T4, is one stack from the tile to the suggestions, so its box starts
  at the tile and ends under the suggestions. The library's tile (44
  against 42) and title (28 high against 22) are 8 px taller than
  Figma's, and the card is 9 taller, so the tile sits 24 under the area's
  top (Figma 42): the tile is at y 284 against Figma's 293, and "It can"
  and the suggestions are within the tolerance of Figma's places (both
  pass). Library gap "Empty state with an icon tile".
- **Reply box.** It has no clip button (452:4067), as D7 and T4: no file
  flow is designed and `Composer` draws its attach button only with an
  action (library gap "Attach in the discussion reply box"). It shows no
  caret (452:4065) or violet focus border (library gap "Composer focus"),
  and its placeholder is a little brighter than Figma's dim grey
  (452:4064, library gap "Composer placeholder colour").
- **Reply box spacing.** The suggestions end 20 above the reply box
  against Figma's 25 (452:4060 to 452:4062): the footer pads 8 above the
  reply box and the page's Container 12 under the suggestions, so the
  empty state fits the screen with no scroll while the card is 9 taller
  than Figma's.
- **Empty state parts.** As in D7 and T4: the tile is a round
  `surface.raised` disc of 44 px (`control.xl`) against Figma's 42, "It
  can" is a `Panel` with its eyebrow title, and the three icons are violet
  (`accent.discuss`). The text is 320 wide (`shell.popover`), as Figma's,
  so its lines break where Figma's do.
- **Home indicator and the area under the reply box.** The app draws no
  home indicator (d-089); the phone AppShell keeps its 34 px area
  (`shell.safeAreaBottom`) under the page. The reply box's footer is
  opaque (`bg.canvas`) so the messages that scroll under it do not show
  through, and covers the stars of the backdrop around the reply box that
  Figma draws.
- **Buttons with no screen yet.** Open in workspace has no action (no
  workspace route), as on T4. Back ("Artifact") and the artifact's card
  return to the artifact (M2); Discuss on M2 opens this page. A
  suggestion fills the reply box and send shows the message in place of
  the empty state; nothing answers it in this mock-up.

## Values picked (d-100)

- Page sides: 12, the phone `Container`'s, as Figma.
- Nav: 4 under the status bar and 40 high, as Figma: the phone
  `Container`'s 4 at the top and 4 above and below its 32 px controls
  (Open in workspace 172 × 32 as Figma). The model and context move into
  the card, under its meta line, as the Inbox's M18.
- Card: 8 under the nav, as Figma. The meta line says "Claude artifact",
  the source in full (`discussion.sourceLabel`), where M2's chip says
  "Claude".
- Discussion: 8 under the card, as Figma; the empty state's tile 24 under
  the area's top (see Empty state).
- "It can": 20 under the text, as Figma and T4. The suggestions 10 under
  it (Figma 12), "TRY" 6 above the first and the buttons 6 apart, as
  Figma.
- Reply box: 12 in, as Figma, and 38 above the bottom, as Figma (17 and
  the home indicator's 21): the footer's 4 and the AppShell's 34.
- The on-screen keyboard: Figma draws none in M9.
