# M08 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M08`, 2026-11-18, against library 1.0.0-beta.28),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/scriptExplainedPhone.ts`: M06's data
(`scriptCodePhone`) with check on its page on Explain, its default view, as
T06 opens it on a tablet. Under Back to Files, the path badge and the tabs,
`ToolkitFilePage layout="phone"` draws the meta line, the switch and the
explanation with no box (`src/app/ToolkitFiles.test.tsx`, the M8 case).
D06, D10, D33 to D36, T04, T06, T32 to T35, M22 and M12 give the same
results as before M08.

One fix round: the first run drew `ScriptExplanation` as it is, padded 20
with each line link at the step's end, so the steps were taller and step 3
(440:1665), its number and step 4 (440:1672) ran under the tab bar or
below the screen (three `notVisible` texts). The phone now clears the
padding and puts each line link under its text (see Explanation), and the
text check passes.

## Checks

- Text: pass. Every Figma string is in the render and visible where
  Figma shows it; step 4 and the rest lie under the tab bar in both.
- Position: 9 of 14 layers pass (`back row`, `button · map`,
  `toggle · Explain | Code`, `tab bar` and the five tabs of the
  navigation). The 5 that fail (`button · copy`, `button · Discuss`,
  `toolkit`, `path badge`, `explain`) are listed below.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame body
  (`div.scroll-frame__body`, see Under the tab bar) and the item tabs'
  list (`div.item-tabs__list`, see Item tabs).

## Deviations

- **Explanation.** `ScriptExplanation` has no narrow layout. On the phone
  `ToolkitFilePage` restyles its slots with tokens so it starts at the
  item's edge, its parts 12 apart, its steps 10 apart and each line link
  under its text, as in Figma. What remains: the step numbers are 24 px
  against 22, so the step text starts 2 px further right; the card pads 16
  by 12 against 15 by 13, so the summary breaks after "in" where Figma's
  breaks after "rules/"; and the explanation ends 10 px higher (`explain`
  y -2, h -10). Gap: Script explanation.
- **Under the tab bar.** Figma draws the walkthrough down past the
  frame's foot (`explain` 440:1630 ends at 1088); step 4 starts above the
  tab bar and runs under it. The tab bar lies over the page (AppShell
  `tabBarOverlay`), so the render's step 4 runs under the bar too, and
  the rest of the page scrolls; the rule check reports the scrolling body
  as `hiddenOverflow`. This is the scroll Figma's own layout causes, as
  on M22.
- **Path badge.** Figma's badge has a 16 px code icon and no copy icon;
  `PathBadge` sizes its icon slot for 12 px, so the badge is 6 px
  narrower (`path badge` w -6.4). Gap: Path badge copy button.
- **Back row buttons.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8), and the copy button 8
  before it too (`button · copy` x +8). Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (440:1510) holds the back row and the
  page, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to the explanation's end (`toolkit`
  y +36, h +273), as on M22 (d-107).
- **Item tabs.** Activity runs past the screen's edge as in Figma; the
  compact list scrolls sideways (`hiddenOverflow` on the item tabs'
  list), as on M12 and M22. The selected tab's outline is
  `border.selected` at half alpha (no solid selected token, d-050).
- **Explain and Code switch.** `ViewSwitch size="md"` is 32 high against
  34, within the position check. Gap: Explain and Code switch.

## Second review

A blind side-by-side review of M08 (Figma left, render right, 390 × 844)
found the differences below. Nothing in `web/` changed for them: the
library part draws each one, and LIBRARY_GAPS.md records the Figma
values. The checks give the same results as before.

- **Overview facts.** Figma puts each key (`In` 440:1635, `Out`
  440:1638, `Exit` 440:1641) in a 40 px column and its value 10 after
  it, 50 from the key's start (x 77). The library's `facts` slot sizes
  the key column to its widest key (`auto`, 10 apart), so the values
  start about 38 px from the keys' start and Exit nearly touches
  "0 pass". `ToolkitFilePage`'s phone override restyles only the root,
  the steps, each step and the line link, not the facts, so it does not
  cause this. Gap: Script explanation.
