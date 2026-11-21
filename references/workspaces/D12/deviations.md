# D12 deviations

What still differs from Figma after the build of four panes
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D11's: the
sidebar beside the workbench. The workbench holds its most, four panes,
clockwise from the top left: bridge themes (focused), drift check, the
empty pane and brain git, which `WorkbenchPanes` gives to the library's
`SplitPanes`. Erik drags hono server over drift check: with four panes no
edge splits, so the drop zone (`edge: 'middle'`) covers the whole pane,
4 in, the pane under it is dimmed, and the zone says the chat would
replace drift check. The dragged chat sits at the zone's bottom end
(`paneDrop.preview: 'end'`).

## Checks

- Text: pass. Every string passes, the drop zone's two lines, the four
  panes' text and all three `78%` layers (the sidebar's hono server row
  402:4565, the empty pane's row 402:4982 and the dragged chat 402:5024)
  included. `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01
  to D11.
- Position: 18 of 36 layers pass; `402:4778`, `402:4794`, `402:4819`,
  `402:4824`, `402:4837`, `402:4920`, `402:4941`, `402:4865`, `402:4894`,
  `402:4907`, `402:5000`, `402:5014`, `402:4951`, `402:4972` and
  `402:4986` fail. The sidebar and its rows pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22, D09 15 of 23, D10 15 of 25, D11 16 of 25
  layers pass, with the same text and rule results). None got worse than
  on 1.0.0-beta.16.

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
- **Bottom row's column gap (Four-pane split).** `402:4920` w +21,
  `402:4941` w +21 and `402:4951` x +19, w -19: Figma splits the rows
  first, so the bottom row has its own column gap, 20 px left of the top
  row's: brain git is 524 wide and the empty pane 564. `SplitPanes`
  splits the columns first, so both rows share one gap and all four
  panes are 545 wide. The empty pane's rows move with its middle:
  `402:4972` x +9.5 and `402:4986` x +9.5.
- **Resize handles (Resize handle).** Figma draws one 44 × 4 pill at rest
  between the rows (402:5028). `SplitPanes` has three handles (between
  the columns and between each column's rows), each a 2 px line that
  shows only on hover, focus or drag, so the gaps are empty at rest. They
  take no `data-*`, so 402:5028 is not measured.
- **Tab bar (Workbench tab bar).** `402:4778` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 to D11.
- **Panes (Workbench tab bar).** `402:4794` y -10, `402:4865` y -10,
  `402:4920` y -6 and `402:4951` y -6: `compact` starts the panes right
  under the 52 px bar, where Figma pads them 10, as on D07 to D11. Each
  pane is 440 high (Figma 436). The drop zone moves up with drift check:
  `402:5000` y -10.
- **Transcript.** `402:4819` y -6.5 and `402:4824` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20), and Copy is 24 px (Figma 22), as on D07 to D11. `402:4894`
  y -6, h +6: drift check's approval moves up with its pane, and its
  h +6 comes from `ProposalBlock`'s padding and its 28 px buttons, as on
  D01 and D09 to D11.
- **Composers.** `402:4837` y -12.5, h +7 and `402:4907` y -9: each
  composer sits at the bottom of its pane (d-107), which ends 6 px higher
  than Figma's, and the attachment chip, the 20 px text line and the
  28 px buttons of `Composer` are taller than Figma's, as on D07 to D11.
  Figma draws a caret after "/"; the story does not focus the box.
- **Dragged chat (Drag preview, Drop zone).** `402:5014` x -21, w +6.4,
  h -10.8: Figma turns the dragged chat 3° and measures its turned box
  (311.6 × 62.8), which also runs 11 px past the zone's right edge. The
  render keeps `DragPreview`'s `tilt` off, as the check measures a turned
  element against its unturned box, and draws it flat, 320 wide
  (`shell.popover`), inside the zone's right end and 4 above its bottom
  edge, so its middle is where Figma's is. At 300 (`shell.popoverFilter`,
  D08 and D10) hono server's meta and Needs you do not fit.
- **Dimmed pane (Drop zone).** Figma fills the zone with
  rgba(8, 13, 26, 0.88) under its cyan tint (402:5000), which dims drift
  check, header included, almost to the background, so the zone's title
  and line read alone over the approval card. The render covers the whole
  pane under the zone with `surface.pane` (rgba(15, 22, 38, 0.85)), the
  library's nearest fill; no token is the dimming of a pane. Until
  2026-11-17 it used `overlay.scrim` (0.65), under which the approval
  card, its buttons and Reply to Codex stayed readable and the zone's line
  ran across Always allow and Deny (review D12 F1).
- **Drop zone title (Drop zone).** Figma's title (402:5001) is SemiBold
  16; no text style is 16/600, so the render uses `labelLg` (16/500).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Empty pane rows (Empty pane rows).** `402:4972` y -8, h +6 and
  `402:4986` h +6: `ListRow density="compact"` rows are 56 px high
  against Figma's 50, as on D01 and D05.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07 to D11.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.

## Value picks (d-100)

- The dimmed pane under a replacing drop: `surface.pane`
  (rgba(15, 22, 38, 0.85)), the nearest token to Figma's
  rgba(8, 13, 26, 0.88), as no token dims a pane; `overlay.scrim` (0.65)
  left the pane readable.
- The zone's title over a pane: `labelLg` (16/500), Figma's size; no
  text style is 16/600 (`subtitle` is 17/600).
- The dragged chat at the zone's end: 4 above the zone's bottom edge
  (spacing `4`) and 320 wide (`shell.popover`), the nearest width in
  which its meta and pill fit (Figma about 289 before its turn).

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
