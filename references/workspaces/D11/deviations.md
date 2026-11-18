# D11 deviations

What still differs from Figma after the build of three panes
(`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.16; measured on 1.0.0-beta.20), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D09's: the
sidebar beside the workbench. Brain git, dropped below drift check (D10),
now has its own pane: `WorkbenchPanes` gives the three panes to the
library's `SplitPanes`, which puts bridge themes on the left at the full
height and drift check over brain git on the right, each at half the
height, 10 apart, with one resize handle between the columns and one
between the right column's rows. Bridge themes keeps the focus. No block
changed, so the split stays general for D12 to D14.

## Checks

- Text: pass. Every string passes, the three panes' text and the hono
  server row's `78%` (402:3920) included. `Artifacts` and `Toolkit` (rail,
  d-105) are excepted as on D01 to D10.
- Position: 16 of 25 layers pass; `402:4133`, `402:4148`, `402:4173`,
  `402:4178`, `402:4191`, `402:4220`, `402:4249`, `402:4262` and
  `402:4274` fail. Each pane's x and width match Figma's within 3 px, and
  brain git's terminal (402:4295) passes.
- Rules: pass.
- Earlier frames: `pnpm fidelity workspaces` on 1.0.0-beta.20 gives the
  results their own deviations.md files list (D01 9 of 17, D02 22 of 27,
  D02b 23 of 27, D03 24 of 43, D04 16 of 35, D05 8 of 21, D06 20 of 24,
  D07 15 of 20, D08 15 of 22, D09 15 of 23, D10 15 of 25 layers pass, with
  the same text and rule results). None got worse than on 1.0.0-beta.16.

## Deviations

- **Resize handles (Resize handle).** Figma draws both handles at rest:
  a 4 × 44 pill between the columns (402:4305) and a 44 × 4 pill between
  drift check and brain git (402:4306). `SplitPanes` draws each handle as
  a 2 px line that shows only on hover, focus or drag, so both gaps are
  empty at rest. Both handles are there and work (drag, arrow keys,
  double-click to share the space equally); they take no `data-*`, so
  402:4305 and 402:4306 are not measured.
- **Tab bar (Workbench tab bar).** `402:4133` x +34.7: the four tabs are
  35 px wider than Figma's together, so New chat sits 35 px further
  right, as on D07 to D10.
- **Panes (Workbench tab bar).** `402:4148` y -10, h +8, `402:4220`
  y -10 and `402:4274` y -6: `compact` starts the panes right under the
  52 px bar, where Figma pads them 10, as on D07 to D10. The right
  column's two panes share the 8 px of extra height, so drift check is
  440 high (Figma 436) and brain git starts 6 px higher.
- **Transcript.** `402:4173` y -6.5 and `402:4178` y -5.5, h +8: bridge
  themes' entries move up with the pane; the reply wraps in body text
  (14/20), and Copy is 24 px (Figma 22), as on D07 to D10. `402:4249`
  y -6, h +6: drift check's approval moves up with its pane, and its
  h +6 comes from `ProposalBlock`'s padding and its 28 px buttons, as on
  D01 (105:291) and D09.
- **Composers.** `402:4191` y -8.5, h +7: the attachment chip, the 20 px
  text line and the 28 px buttons of `Composer` are taller than Figma's,
  as on D07 to D10. `402:4262` y -9: drift check's composer sits at the
  bottom of its pane (d-107), and the pane ends 6 px higher than Figma's,
  with the composer's 3 px of extra height. Figma draws a caret after
  "/"; the story does not focus the box.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against
  Figma's 14 px icons with no button box, as on D07 to D10.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.

## Value picks (d-100)

None: the split's sizes are `SplitPanes`' equal shares, and its gaps are
the library's.
