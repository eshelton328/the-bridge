# T37 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T37`, 2026-11-17, against the library build
installed in this worktree), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentHowItWorksTablet.ts`: D38's data
(`agentHowItWorks`), with no `elsewhere`, because T37 draws nothing under
the steps, and `ui.from` set to the skill writer, as on T07. On a tablet the
agent replaces the list in the shared `DetailFrame` (d-107). The back row
shows the breadcrumb Toolkit › writer › writing-reviewer; the item keeps its
kind badge, name and path row (its `how` does not set `named`), and the How
it works tab is T10's `ToolkitHowColumn`: the trigger across the item, then
the four steps in one column. D14, D37, D38, D39, T10, M12 and T07 give the
same results as before T37. T36 fails the same layers as before; its steps
now start 1 px above Figma's (they were 3 px above), so its `toolkit item`
is 2 px taller (h -436 against -438).

## Checks

- Text: pass. Every Figma string is in the render and visible, with the
  breadcrumb's two `›` and writing-reviewer twice (breadcrumb and title);
  no extra text and no covered text. No text runs under the tab bar.
- Position: 16 of 19 layers pass (`back row`,
  `breadcrumb · Toolkit › writer › writing-reviewer`,
  `button · Show on map`, `meta row`, `kind badge`, `path row`,
  `path badge`, `steps`, `step 1` to `step 4`, the three `uses · …` chips
  and `tab bar`). The 3 that fail (`button · Discuss`, `toolkit item`,
  `trigger`) are listed below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (495:2159) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item` y +32,
  h -436, x +2, w -4: the Container pads 24 at the sides against 22). This
  is the d-107 structure that keeps Back in view, as on T07 and T36 (gap:
  Tablet item spacing).
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of the Container (Figma 22) it starts
  5 px further left (`button · Discuss` x -5.1, h -2). Gaps: Item action
  buttons, Tablet item spacing.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); it starts 2 px above Figma's y (see Kind badge).
  Figma's steps start 14 under the trigger; under the item's full header
  the column puts them 6 under the taller trigger, so `steps` and every
  step card start 3 px above Figma's (gap: How it works trigger).
- **Kind badge.** Figma draws the Agent badge 27 px high (as on T07),
  where the render's `KindBadge` is 25, the height of every other kind's
  badge. The title, path row, tabs and trigger therefore sit 2 px higher
  than Figma's; each passes the position check but the trigger's height.
- **Breadcrumb.** The library has no breadcrumb (gap: Item breadcrumb).
  As on T07, `BackRow` draws the chevron and Toolkit; the separators,
  writer and writing-reviewer follow as text in the same label style. The
  breadcrumb's box passes the position check.
- **Title width.** The title writing-reviewer is wider and 2 px taller
  than Figma's 206 × 38: the `heading` glyphs and line height, as on T07
  (`441:93` w +14.7). `495:2187` is not a position key on T37.
- **Step cards.** A card with a use is 86 high against 88 (the chips are
  22 high against 23), and the arrow rows are 16 high against 14. The
  chips' text is white where Figma colours it as the step's kind: the code
  chips (`writer/scripts/check`, `ls, grep, git ls-files`) cyan (gap: How
  it works use chip). The step numbers are `Badge variant="outline"`,
  22 high against 19 (gap: How it works steps).
- **Copy button.** As on T07, the path badge's copy icon is a plain
  button with `CopyIcon` (gap: Path badge copy button); the path row
  passes the position check.
- **Item tabs.** The selected tab (How it works) is white with a grey
  outline where Figma's is cyan with a cyan outline (gap: Item tab selected
  tone), and the tabs are spaced wider: Activity ends about 30 px further
  right (gap: Item tab spacing). Neither is styled by hand.
- **Only inputs line.** D38 draws the only inputs the agent gets under the
  steps; T37 draws nothing there, so the state leaves `elsewhere` out and
  the render shows nothing under step 4, as in Figma.
- **Tab bar.** The six tab bar items spread across the full width, where
  Figma groups them in the centre. The tab bar is the shared `AppTabBar`
  (d-105), as on T07, T10 and T36; its box passes the position check, and
  a change to it needs the app-frame lock.
