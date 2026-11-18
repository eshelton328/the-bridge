# T04 deviations

What still differs from Figma after round 2 of the fidelity loop (`pnpm
fidelity artifacts T04`, 2026-11-17, against the installed library
1.0.0-beta.19; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
T4 is D7's discussion (`../D07/deviations.md`) on the iPad mini, as a page
of its own in the place of T2's artifact page, with no tab bar, as the
Inbox's T17. All three checks render the page 29 px shorter, below Figma's
status bar (d-102), and the position check adds 29 to each render y.

## Checks

- Text: passes. Nothing is missing, hidden or extra, with no exception.
- Position: 9 of 12 layers pass (`nav`, `452:3837` (Open in workspace),
  `artifact · discussing`, `pill · New`, `chevron · open artifact`,
  `guard`, `suggestions`, `model and context` and
  `composer · discussion`). Three fail; see
  below.
- Rules: pass.

## Deviations

- **Model and context.** Passes (218 × 26 against 220 × 22): since
  library #142 `ModelChip` is 82.2 wide against Figma's 83 and its chevron
  takes the label's tone, and "context" is `smallXs` (Regular 11/16),
  38 wide as Figma's 11 px label (454:329), in place of the 46 px wide
  `monoSm`. The chip is 26 high against 22 and the label's line 16
  against 14, on the 4 px grid (d-072). Library gap "Model chip width".
- **Discussion area.** `discussion` h -121: Figma's `discussion` frame
  (452:3793) holds the reply box too, down to y 1125. The page keeps the
  reply box in the shared `DetailFrame`'s sticky footer, so it stays at
  the bottom while the messages scroll (d-107), and the element marked
  `discussion` is the messages' area only, which ends 20 above the reply
  box. The reply box itself (`composer · discussion`) passes.
- **Empty state.** `empty state` y +54, h +115: Figma's `empty state`
  frame (452:3794) starts 60 above its tile and holds the tile, the
  title and the text, and a second frame (`center`, 452:3800) holds "It
  can" and the suggestions. The library-built `DiscussionEmpty`, shared
  with D7, is one stack from the tile to the suggestions, so its box
  starts at the tile and ends under the suggestions. The library's tile
  (44 against 42) and title (28 high against Figma's 22) are 8 px taller
  than Figma's, so the tile sits 8 higher to keep the text, "It can" and
  the suggestions at Figma's places: the tile is at y 253 against
  Figma's 259, the title about 3 px higher, and the text, "It can"
  (y 421 against 420) and the suggestions within 2 px of Figma's. "It
  can" is 20 under the text, as Figma's (452:3799 to 452:3801);
  D7's panel keeps its 10 (`DiscussionEmpty place="page"`). Library
  gap "Empty state with an icon tile".
- **"It can" column.** `it can` x -74, w +148: Figma sets the panel in a
  560 px column, centred (452:3801, x 98 to 658). No size token is 560,
  so the panel takes the page's 708 px; the suggestions under it are
  centred, as Figma's, and pass. Library gap "Empty state with an icon
  tile".
- **Reply box.** It has no clip button (452:3828), as D7: no file flow
  is designed and `Composer` draws its attach button only with an
  action (library gap "Attach in the discussion reply box"). It shows no
  caret (452:3826) or violet focus border (library gap "Composer
  focus"), and its placeholder is a little brighter than Figma's dim grey
  (452:3825, library gap "Composer placeholder colour").
- **Empty state parts.** As in D7: the tile is a round `surface.raised`
  disc of 44 px (`control.xl`) against Figma's 42, "It can" is a `Panel`
  with its eyebrow title, and the three icons are violet
  (`accent.discuss`).
- **Home indicator and the area under the reply box.** The app draws no
  home indicator (d-089). The reply box's footer is opaque (`bg.canvas`)
  so the messages that scroll under it do not show through, and covers
  the stars of the backdrop under the reply box that Figma draws.
- **Buttons with no screen yet.** Open in workspace has no action (no
  workspace route), as in D7. Back ("Artifact") and the artifact's card
  return to the artifact (T2); Discuss on T2 opens this page. A
  suggestion fills the reply box and send shows the message in place of
  the empty state; nothing answers it in this mock-up.

## Values picked (d-100)

- Page sides: 24 (Figma 22, on the 4 px grid, as T1 and T2).
- Nav: 4 under the status bar and 40 high, as Figma: the tablet
  `Container`'s 12 at the top less 8 (`mt: -8`) and 4 above and below
  its 32 px controls (`Button` md, Open in workspace 172 × 32 as Figma).
  The model and context sit between two equal spacers, as Figma's.
- Card: 8 under the nav, as Figma. `Panel variant="notice"` pads 10
  above and below and 12 at the sides (Figma 11 and 13), its rows 4
  apart (Figma 5); the card is 100 high against 96. The title is
  `paneTitle` (SemiBold 15), as the Inbox's task card; New is
  `StatusPill tone="working"` with its dot, as Figma's pill.
- Discussion: 8 under the card, as Figma; the empty state's tile 64
  under the area's top (Figma 74; 32 and 32, on the 4 px grid), so the
  taller tile and title end where Figma's do.
- "It can": 20 under the text, as Figma (the stack's 10 and `mt` 10).
- Reply box: 12 under the messages, as Figma, and 40 above the bottom
  (Figma 22 and the home indicator's 21, 43; 40 is the nearest token).
  Its cap is the desktop panel's, `min(50vh, 30cqh)`
  (`blocks/discussionReply.ts`), against the page's height.
