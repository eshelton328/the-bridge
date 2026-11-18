# D13 deviations

What still differs from Figma after the build of the emptied pane
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D12's without
the drag: the sidebar beside the workbench and four panes clockwise from
the top left, bridge themes (focused), drift check, the empty pane and
brain git, in the library's `SplitPanes`. The pane at the bottom right
has emptied and keeps its place; at its top end it has Close pane and,
under it, the shortcut Cmd+W (`emptiedPane`, the empty pane's `close`).

## Checks

- Text: pass. Every string passes, both `78%` layers (the sidebar's hono
  server row 402:6067 and the empty pane's row 402:6484) included.
  `× Close pane` (402:6503) is excepted: Figma types the × as a character,
  and the render draws it as the library's `CloseIcon` before "Close
  pane". `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01 to
  D12.
- Position: 15 of 30 layers pass; `402:6280`, `402:6296`, `402:6321`,
  `402:6326`, `402:6339`, `402:6422`, `402:6443`, `402:6367`,
  `402:6396`, `402:6409`, `402:6453`, `402:6502`, `402:6504`, `402:6474`
  and `402:6488` fail. The sidebar and its rows pass.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22, D09 15 of 23, D10 15 of 25, D11 16 of 25,
  D12 15 of 30 layers pass, with the same text and rule results). None got
  worse than on 1.0.0-beta.16.

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
- **Close pane and Cmd+W (Close pane button).** `402:6502` x -12, y -6,
  w +12 and `402:6504` x -4.6, y -8, w +4.6: Figma's Close pane is 94 ×
  30 with a cyan border, the selected fill and a cyan label; the render's
  is a secondary `Button size="sm"` (28 high, grey border, default label)
  with a 12 px `CloseIcon`, 106 wide, because `Button` draws the cyan
  look only on a `pressed` toggle, which would make Close pane announce
  itself as pressed. Cmd+W is a 28 px `sm` button with a Medium 12 label,
  where Figma's is 30 high in mono 12. Both sit 12 in from the pane's top
  and end, 6 apart, as in Figma; their y follows the pane, which starts
  6 px higher (see Panes).
- **Bottom row's column gap (Four-pane split).** `402:6422` w +21,
  `402:6443` w +21 and `402:6453` x +19, w -19: Figma splits the rows
  first, so brain git is 524 wide and the empty pane 564; `SplitPanes`
  splits the columns first, so all four panes are 545 wide, as on D12.
  The empty pane's rows move with its middle: `402:6474` x +9.5 and
  `402:6488` x +9.5.
- **Tab bar (Workbench tab bar).** `402:6280` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 to D12.
- **Panes (Workbench tab bar).** `402:6296` y -10, `402:6367` y -10,
  `402:6422` y -6 and `402:6453` y -6: `compact` starts the panes right
  under the 52 px bar, where Figma pads them 10, as on D07 to D12. Each
  pane is 440 high (Figma 436).
- **Transcript.** `402:6321` y -6.5 and `402:6326` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20), and Copy is 24 px (Figma 22), as on D07 to D12. `402:6396`
  y -6, h +6: drift check's approval moves up with its pane, and its
  h +6 comes from `ProposalBlock`'s padding and its 28 px buttons, as on
  D01 and D09 to D12.
- **Composers.** `402:6339` y -12.5, h +7 and `402:6409` y -9: each
  composer sits at the bottom of its pane (d-107), which ends 6 px higher
  than Figma's, and the attachment chip, the 20 px text line and the
  28 px buttons of `Composer` are taller than Figma's, as on D07 to D12.
  Figma draws a caret after "/"; the story does not focus the box.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Empty pane rows (Empty pane rows).** `402:6474` y -8, h +6 and
  `402:6488` h +6: `ListRow density="compact"` rows are 56 px high
  against Figma's 50, as on D01, D05 and D12.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07 to D12.
- **Resize handles.** Figma draws no handle in D13; `SplitPanes` has
  three, each hidden at rest, so none shows, as in Figma.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

## Value picks (d-100)

- Close pane and its shortcut: 12 in from the empty pane's top and end
  (spacing `12`) and 6 apart (spacing `6`), Figma's values, which the
  spacing scale has.
- Close pane's label: `textSize="sm"` (Medium 13/16), the nearest to
  Figma's 13 px label; Cmd+W's: `textSize="xs"` (Medium 12/16), as no
  button label is mono.
