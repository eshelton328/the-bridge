# D09 deviations

What still differs from Figma after the build of two panes side by side
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D07's: the
sidebar beside the workbench. Drift check, dropped on the right of bridge
themes (D08), now has its own pane: `WorkbenchPanes` gives the two panes
to the library's `SplitPanes`, which puts them side by side at half the
width each, 10 apart, with the resize handle in the gap. Bridge themes
keeps the focus; drift check is D01's pane, with its approval.

## Checks

- Text: pass. Every string passes, both panes' text and the hono server
  row's `78%` (402:1400) included. `Artifacts` and `Toolkit` (rail, d-105)
  are excepted as on D01 to D08.
- Position: 15 of 23 layers pass; `402:1613`, `402:1628`, `402:1653`,
  `402:1658`, `402:1671`, `402:1699`, `402:1728` and `402:1741` fail. The
  panes' x and width match Figma's within 2 px: each is half the width.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22 layers pass, with the same text and rule
  results). None got worse than on 1.0.0-beta.16.

## Deviations

- **Resize handle (Resize handle).** Figma draws a 4 × 44 pill
  (402:1753) in the gap between the panes at rest. `SplitPanes` draws its
  handle as a full-height 2 px line that shows only on hover, focus or
  drag, so the gap is empty at rest. The handle is there and works (drag,
  arrow keys, double-click to share the width equally); it takes no
  `data-*`, so 402:1753 is not measured.
- **Tab bar (Workbench tab bar).** `402:1613` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 and D08.
- **Panes (Workbench tab bar).** `402:1628` y -10, h +8 and `402:1699`
  y -10, h +8: `compact` starts the panes right under the 52 px bar,
  where Figma pads them 10, as on D07 and D08. Their x and width match.
- **Transcript.** `402:1653` y -6.5 and `402:1658` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20) on two lines, and Copy is 24 px (Figma 22), as on D07.
  `402:1728` y -6, h +6: drift check's approval moves up with its pane
  and its h +6 comes from `ProposalBlock`'s padding and its 28 px
  buttons, as on D01 (105:291).
- **Composers.** `402:1671` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D07. `402:1741` y -5: drift check's composer moves up with its
  pane. Figma draws a caret after "/"; the story does not focus the
  box. The composers keep the layout of the earlier frames (d-107).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

## Value picks (d-100)

None: the split's sizes are `SplitPanes`' equal shares, and its gap is
the library's.
