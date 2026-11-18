# T38 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T38`, 2026-11-17, against the library build
installed in this worktree), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookHowItWorksTablet.ts`: D39's data
(`hookHowItWorks`), with no `elsewhere`, because T38 draws nothing under
the steps, and step 3's use (commits-and-prs) shown as a file, because
T38 gives it the file icon (495:2871) where D39 gives it the rule icon. On a
tablet the hook replaces the list in the shared `DetailFrame` (d-107). The
item keeps T19's header (the back row to Toolkit, the kind badge, the name
and the path row; its `how` does not set `named`), and the How it works tab
is T10's `ToolkitHowColumn`: the trigger across the item, then the five
steps in one column. D14, D37, D38, D39, T10, M12, T36, T37 and T19 give the
same results as before T38.

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text and no covered text. No text runs under the tab bar: step 5 ends at
  y 727, far above it.
- Position: 15 of 18 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `steps`, `step 1` to
  `step 5`, `uses · commits-and-prs`, `uses · git commit` and `tab bar`).
  The 3 that fail (`button · Discuss`, `toolkit item`, `trigger`) are
  listed below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (495:2546) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item` y +32,
  h -386, x +2, w -4: the Container pads 24 at the sides against 22). This
  is the d-107 structure that keeps Back in view, as on T19, T36 and T37
  (gap: Tablet item spacing).
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of the Container (Figma 22) it starts
  5 px further left (`button · Discuss` x -5.1, h -2). Gaps: Item action
  buttons, Tablet item spacing.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); the steps start 1 px above Figma's, and each step
  card passes the position check (gap: How it works trigger).
- **Step cards.** The step numbers are `Badge variant="outline"`, 22 high
  against 19, and the arrow rows between the cards are 16 high against 14
  (gap: How it works steps). The chips' text is the badge's muted colour
  where Figma draws it white, and the code chip's text (git commit) is not
  cyan (gap: How it works use chip). Every card and both chips pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with
  `CopyIcon` (gap: Path badge copy button); the path row passes the
  position check.
- **Item tabs.** The selected tab (How it works) is white with a grey
  outline where Figma's is cyan with a cyan outline (gap: Item tab selected
  tone), and the tabs are spaced wider: How it works starts about 10 px and
  Activity about 33 px further right (gap: Item tab spacing). Neither is
  styled by hand.
- **Tests line.** D39 draws the hook's tests under the steps; T38 draws
  nothing there, so the state leaves `elsewhere` out and the render shows
  nothing under step 5, as in Figma.
- **Tab bar.** The six tab bar items spread across the full width, where
  Figma groups them in the centre. The tab bar is the shared `AppTabBar`
  (d-105), as on T19, T36 and T37; its box passes the position check, and
  a change to it needs the app-frame lock.
