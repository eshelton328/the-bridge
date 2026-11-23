# D14 deviations

What still differs from Figma after the build of the resized panes
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D13's after the
empty pane closes: the sidebar beside the workbench, bridge themes
(focused) and drift check in the top row and brain git across the whole
bottom row (`resizedPanes`, `data.split: 'rows'`). Erik drags the handle
between the top row's panes to 60 : 40 (`ui.resize`), and the readout
`60 : 40  ·  double-click for 50 : 50` shows near the handle.

## Checks

- Text: pass. Every string passes, the readout's and the sidebar's hono
  server row's `78%` (402:6764) included. `Artifacts` and `Toolkit` (rail,
  d-105) are excepted as on D01 to D13.
- Position: 19 of 32 layers pass; `402:6977`, `402:6993`, `402:7018`,
  `402:7023`, `402:7036`, `402:7151`, `402:7064`, `402:7093`, `402:7106`
  and `402:7118` fail. The sidebar and its rows pass, and the panes'
  widths match Figma's 60 : 40 split (654 and 436 against 652 and 436).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22, D09 15 of 23, D10 15 of 25, D11 16 of 25,
  D12 15 of 30, D13 15 of 30 layers pass, with the same text and rule
  results). None got worse than on 1.0.0-beta.16.

## Deviations

- **Text sizes (Workbench status bar text, Pane header text, Message
  text).** Figma draws the status bar in Geist Mono 11, a pane header's
  title in SemiBold 13 with its model and context in Geist Mono 11, Erik's
  message in 13/19 and an agent's name in SemiBold 12 (D08 402:1033,
  402:1042, 402:1066, 402:1072). The library's `Workbench` status bar
  draws `mono` (12), `Pane` draws `label` (14/500) and `mono` (12), and
  `Message` draws `body` (14/20) and `label` (14/500); none takes a text
  size, so each is about one size larger than Figma's (fidelity review D08
  F1, F2, F4).
- **Readout (Resize readout).** `402:7151` x +24.2, y -5, w -23.2, h -8:
  Figma's readout is a 282 × 30 box with a cyan border, the selected fill
  and padding 11; the render's is the library's outline `Badge` in the
  working tone, 259 × 22, with the same cyan mono text but a grey border
  on the overlay fill and padding 6 × 2. Its end is 8 in from the pane's
  end (Figma 9), so the narrower box starts 24 px further right; it is
  centred on the pane, which ends 5 px higher than Figma's (see Panes).
- **Dragged handle (Resize handle).** Figma draws the drag: a 2 px cyan
  line in the gap over the top row's height (402:7149) with a 4 × 44 pill
  at the pointer (402:7150), and a 44 × 4 pill at rest between the rows
  (402:7153). The library's `Splitter` shows its line only during a real
  drag or focus and never draws the pill, so the render's gaps are empty.
- **Rows-first split (Rows-first split).** `SplitPanes` splits the
  columns first; the render nests the library's `Splitter` rows first
  (`RowsSplit`), so the boxes match Figma's within the tolerance apart
  from the tab bar's offset below.
- **Panes (Workbench tab bar).** `402:6993` y -10, h +5, `402:7064`
  y -10, h +5 and `402:7118` y -5: `compact` starts the panes right
  under the 52 px bar, where Figma pads them 10, as on D07 to D13; each
  row is 440 high (Figma 435 and 437).
- **Tab bar (Workbench tab bar).** `402:6977` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 to D13.
- **Transcript.** `402:7018` y -6.5 and `402:7023` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20), and Copy is 24 px (Figma 22), as on D07 to D13. `402:7093`
  y -6, h +6: drift check's approval moves up with its pane, and its
  h +6 comes from `ProposalBlock`'s padding and its 28 px buttons, as on
  D01 and D09 to D13.
- **Composers.** `402:7036` y -11.5, h +7 and `402:7106` y -8: each
  composer sits at the bottom of its pane (d-107), which ends 5 px higher
  than Figma's, and the attachment chip, the 20 px text line and the
  28 px buttons of `Composer` are taller than Figma's, as on D07 to D13.
  Figma draws a caret after "/"; the story does not focus the box.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07 to D13.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Smallest pane.** The note proposes that a pane stops shrinking at
  400 px wide or 240 px tall. It is a proposal, not a decision, and
  `Splitter` takes its minimum in percent (10 % by default), so the build
  keeps the library's minimum.

## Value picks (d-100)

- The readout's place: 8 in from the pane's end (spacing `8`; Figma 9,
  which the spacing scale does not have), centred on the pane's height.
- The top row's split: `[60, 40]` percent, Figma's 652 and 436 of the
  row's 1088 px less the gap.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
