# D01 deviations

What still differs from Figma after the fidelity loop, each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The numbers below are from `pnpm fidelity toolkit` on 2026-11-18,
against the installed library 1.0.0-beta.47, with the props that
library #166 added: `Card metaSpacer` on each card,
`GroupHeader variant="toolkit"` on SKILLS and AGENTS, and
`Button padding="compact"` on Sort. The search and Sort now span the
first two of the cards' four columns (16 apart), and the legend ends the
last two.

## Checks

- Text: pass. Eight card descriptions are cut with an ellipsis, as
  Figma cuts them; `exceptions.json` names each layer (425:85, 425:99,
  425:113, 425:142, 425:184, 425:199, 425:235, 425:250).
- Position: 29 of 31 layers pass: `header`, `read-only`,
  `view · List, Map or Activity`, `list tools`, `search`,
  `button · Sort`, `counts legend`, `group · SKILLS`, `group · AGENTS`,
  every card key and the shared navigation's items (`rail · Inbox`,
  `rail · Workspaces`, `rail · Projects`, `rail · Artifacts`,
  `rail · Toolkit` and `rail · More`). On main (beta.47 without these
  props) 13 passed.
- Rules: fail. One `hiddenOverflow` finding: the list scrolls
  (`div > div.backdrop > div.backdrop > div.app-shell__root > main.app-shell__detail`,
  scrollHeight 1084 against 982); see List height. The `hiddenOverflow`
  findings on the eight cut descriptions are in `exceptions.json`.

## Deviations

- **List height.** The cards are now 148 px high against Figma's 150, so
  the list is 1084 px high and scrolls past the frame's bottom edge, as
  Figma's does: Figma's last card row (`toolkit card · readme-cold-reader`,
  425:272) runs from y 902 to 1052 in the 982 px frame. Figma's `toolkit`
  layer (425:9) is clipped to the frame, so the render's is longer
  (`toolkit` h +102). The scrolling list also gives the rules check its
  `hiddenOverflow` finding on `main.app-shell__detail`. The render is
  right here; T01 and M01 name the same finding in `exceptions.json`, and
  this branch adds no exception, so the finding stays open for Erik.
- **Card height.** Library #166 closed it (gap row Toolkit card height,
  closed): `metaSpacer` puts the counts 34 px under the description, as
  Figma's spacer (425:86) does, and every card key passes. Each card is
  2 px shorter than Figma's (148 against 150), so each later row starts
  a little higher, within the tolerance.
- **Kind tile.** The card's kind tile is 36 px (`KindTile size="lg"`)
  against Figma's 32 with a 16 px icon against 17: no kindTile token has
  32, and no icon token has 17, which is off the 4 px grid (d-100; gap:
  Kind tile 32 px). The name and path move 2 px down in the title row.
- **View switch.** List, Map and Activity pass the position check, and
  with `tone="accent"` the selected List item has the selected fill with
  no border and a cyan label and icon, as in Figma. The switch is still
  36 px high against Figma's 38, with a 2 px inset against 4 and 16 px
  icons against 15: 38 is off the 4 px grid (d-100), and no icon token
  has 15 (gap: View switch 38 px).
- **Kind chips.** The chip row is 565.8 px wide against Figma's 580 and
  32 high against 34 (`filter · chips` w -14.2). With `padding="none"`
  the row has no inset, as in Figma. The `md` chips are 32 px high with
  10 px sides, where Figma's desktop chips are 34 high and each about
  2 px wider (All is 63 px). 34 is off the 4 px grid (d-100), and no
  control token has 34 (gap: Kind chip row).
- **Sort button.** With `padding="compact"` Name is 108.5 px wide
  against Figma's 105 and passes the position check; it starts 3.5 px
  after Figma's (x 671.5 against 668). Its icons are 16 and 12 px
  against Figma's 15 and 13: no icon token has 15 or 13 (d-100; gap:
  Sort button with chevron).
- **Search width.** The search spans what Sort leaves of the first two
  card columns: 569.5 px against Figma's 566 (within the tolerance). No
  size token has 566 (gap: Toolkit search width).
- **Group headers.** SKILLS and AGENTS use `GroupHeader
  variant="toolkit"`: 32 px high against Figma's 31, the label 10 under
  the top, and both pass the position check. The chevron is the
  library's 12 px.
- **Rules, Workflows and Hooks.** The frame shows only the Skills and
  Agents cards, so the state has no items for the other three kinds;
  their chips show Figma's counts (8, 2 and 1).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (424:141)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 424:141 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (425:7) where
  the other rail icons are 22; the shared AppRail draws every item's icon
  at 24 (d-100), so the render's icon is 24 and `exceptions.json` names
  425:7, as for `icon/artifacts`.

## Second review

- The reviewer read a comma after "Read from toolkit/ in the brain" in a
  scaled image; the code and the text check have none.
