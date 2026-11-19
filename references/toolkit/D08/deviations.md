# D08 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D08`, 2026-11-17, against the installed library
1.0.0-beta.15), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowOpen.ts`: D9's list data (only the
Rules, Workflows and Hooks groups), and the workflow skill-eval-round
open beside it. D03, D04, D07 and D09 give the same results as before D08
(D03: text fail with the same four strings, 15 of 53 layers; D04: text
pass, 15 of 49 layers; D07: text pass, 21 of 36 layers; D09: text fail
with the same three strings, 21 of 43 layers, the same `hiddenOverflow`
on the list pane; D03, D04 and D07 rules pass). The Checks below are
from a rerun with library 1.0.0-beta.25 and the item tabs' `tone` and
`density` props (2026-11-17).

The workspace stays on library 1.0.0-beta.15: no part of beta.16
(TerminalLines, EmptyPane, DragPreview, Popover `width="xs"`, OptionList
`labelStyle="mono"` and `check={false}`) draws a part of D8.

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 2 Figma strings (`Workflows`,
  `2`); each is explained below.
- Position: 46 of 58 layers pass. The 12 that fail: `group · WORKFLOWS`
  y -5; `group · HOOKS` y -6; `433:1033` w +8; `button · Open full page`
  x -5.5, w +5.5; `label · new failure` w -6.8; `columns` h +17; `file
  preview` w -5.6, h +17; `preview bar` w -5.6; `rendered markdown` w
  -5.6, h +17; `side` x -5.6, w +5.6; `files` x -5.6; `file ·
  skill-eval-round.md` x -5.6. Each is explained below.
- Rules: pass. 1 finding is excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="filter · chips"] >
  div.filter-chips__root`.

## Deviations

- **Row height.** Each list row is 52 px high against Figma's 53, and
  the open item's row 52 against its 55 (`ListRow padding="pane"`,
  library 1.0.0-beta.65); 53 and 55 are off the 4 px grid (d-100), so 52
  is the decision. The kind tile, the name over the path and the counts
  sit centred down the row, as in Figma; the tile is 11 px in against
  Figma's 10, since 10 needs a 9 px padding that no space token has
  (gap: Toolkit row (pane)). Each row starts higher than Figma's by 1 px
  for each row above it and 3 px after the open item's row, and the
  group headers are 3 px taller than Figma's 27. The keys past the
  tolerance: `group · WORKFLOWS` y -5; `group · HOOKS` y -6. With the
  shorter rows the last rows' text (`commit-msg`, `hooks/commit-msg`,
  `→1 ←1`) lies above the frame's foot and is visible, so its exceptions
  are gone. The list no longer runs past the frame's foot, so the pane
  does not scroll on its own and its `hiddenOverflow` exception on
  `[data-figma="toolkit list"]` is gone.
- **Connector lines.** The straight arrows are the library's `FlowLine`
  (library #133 and #137): down between the steps of Run and Decide,
  across into Run (under `yes`, which sits over the line as Figma's), into
  both Grade steps and into Aggregate, each across line 38 long from a
  card's edge to 2 before the next, and the long amber line from
  Pre-registered? down to Stop with `no` beside it. The elbows are the
  library's `FlowElbow` (library #144, beta.36): from Blinding up into
  both grades (466:6) and from Second grades up into Aggregate (466:7),
  each turning halfway across and its tip 2 before the card. The dashed
  amber loop (466:10) is `FlowLoop end="up"`: from Owner decides' foot
  down, back under the lanes and up into Stop's foot, its tip 4 under the
  card, with `new failure` on the line, centred as Figma's. The join into
  Aggregate draws its straight line and its elbow with one head each, at
  the same place, so the picture shows one head.
- **Step cards.** `FlowDiagram` numbers its steps itself and puts the
  body beside the number, so the cards are drawn with its card's tokens
  (gap: Workflow flow by phase): 10 px padding against Figma's 11, the
  marks as `Badge variant="outline"` (a gate's `?` as
  `variant="tag" tone="needsYou"`), 22 px high against 19. All ten cards
  are 82 px high and pass the position check. Stop's dashed border uses
  the needs-you border colour on the card fill.
- **Lanes.** The flow box pads 12 at the sides against Figma's 14 (no
  space token has 14), so each lane is 212.5 px wide against 212; the
  cards pass the position check.
- **Loop label.** `new failure` is a `Badge variant="tag"
  tone="needsYou"`, 91 × 20 against Figma's bordered pill of 98 × 23
  (`label · new failure` w -6.8). The tag's tint is see-through, so the
  label stands on the box's colour (`surface.pane`, in the tag's `sm`
  radius) and the dashed line does not show through it, as under
  Figma's pill. `FlowLoop`'s own label is plain `mono` text under the
  line, not a pill on it, so the flow does not use it (gap: Workflow flow
  by phase).
- **Open full page.** `Button size="sm" textSize="sm"` with the 16 px
  `ExternalLinkIcon` is 127.5 × 28 against Figma's 122 × 29 with a 13 px
  icon (`button · Open full page` x -5.5 w +5.5). It sets
  `ui.flowFullPage`; D13, the full page, is a later frame.
- **Rendered file.** The rendered skill-eval-round.md is 17 px taller
  than Figma's (`columns` h +17, `file preview` h +17,
  `rendered markdown` h +17): `MarkdownView` spaces its title,
  paragraphs and heading on the 4 px grid (d-072), as in D7. To keep the
  item inside the frame with no scroll, the item pane pads 24 under its
  content (it was 40); the item fills the frame's height in every other
  frame, so D3, D4, D7 and D9 do not change.
- **Overview columns.** The preview is 554.4 px wide against Figma's 560
  and the side column 369.6 against 364, so the side starts 5.6 px
  further left. No size token has 560 or 364, and the grid shares the
  row 3 to 2 (gap: Item overview columns): `file preview` w -5.6,
  `preview bar` w -5.6, `rendered markdown` w -5.6, `side` x -5.6
  w +5.6, `files` x -5.6, `file · skill-eval-round.md` x -5.6 y +4 (gap:
  Item file summary: 16 px icons against 14 and the 16 px `mono` line).
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`433:1033` y -2 w +8): Figma's text box
  ends at its longest line, and the render's paragraph fills its column.
  It is one line in both.
- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D8 draws no chip selected, as D3, D4, D7 and D9
  do. The app keeps one rule for every frame: the chip of the current
  filter is selected.
- **Buttons, copy button, preview bar.** As in D3, D4, D7 and D9: Discuss
  and Show on map are both 32 px high against Figma's 34 and 36 (gap:
  Item action buttons); the copy icon is a plain button with `CopyIcon`
  (gap: Path badge copy button); the preview box and bar are drawn with
  the Panel's tokens, with a 16 px file icon against 14 (gap: File
  preview). The three pass the position check.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (433:766)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 433:766 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (433:771)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 433:771, as for `icon/artifacts`.

## Second review

- **Gate fill.** The reviewer saw Pre-registered? and Owner decides filled
  with an amber tint, where Figma draws only the amber border and title
  on the card's own fill. Fixed: a gate now keeps the card's fill.

- **Agent link chip.** The `eval-grader` chip has a grey border where
  Figma's is the agent purple, and it is about 3 px taller with a
  slightly larger label. It is a secondary `Button` (gap: Agent link
  chip).

## Library connectors

After the move to `FlowLine`, `pnpm fidelity` on every built frame of inbox, workspaces, artifacts
and toolkit (2026-11-18, library 1.0.0-beta.31) gives D08 the same results as
before: the same text, position and rule results.

## Library beta.36 parts

The elbows and the loop moved to `FlowElbow` and `FlowLoop end="up"`
(library #144, beta.36). `pnpm fidelity toolkit` on every Toolkit frame
before and after the change (2026-11-18) gives D08 the same text and rule
results (text fail with `commit-msg`, `hooks/commit-msg` and `→1 ←1`;
rules fail with the list pane's `hiddenOverflow`) and the same 35 of 58
passing layers. `label · new failure` is 20 high against 21 (its wrapper
is now as high as the badge); its other edges do not move.
