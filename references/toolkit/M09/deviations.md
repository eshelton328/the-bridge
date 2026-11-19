# M09 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity toolkit M09`, 2026-11-17, against the installed library
1.0.0-beta.26), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowFullPagePhone.ts`: T08's data
(`workflowFullPageTablet`) on the phone. D13, T08, D14, T07, M19 and M22
give the same results as before M09 (each report's text, position and rule
results are unchanged). The frame's `exceptions.json` excepts the
`hiddenOverflow` findings below, each with the entry that records it; with
them the text and rules checks now pass.

## Checks

- Text: pass. Every Figma string is in the render and visible; no text is
  covered where Figma does not cover it, and no render text is extra. The
  steps that Figma draws under the tab bar (Aggregate and its lines) lie
  under the tab bar in the render too.
- Position: all layers but three pass, among them the breadcrumb row,
  `button · map`, the meta row, the title (`448:491`), the tabs, the
  description (`448:492`), `steps`, all nine step cards,
  `parallel · 4 and 5`, `arrows · into 4 and 5`, `arrows · out of 4 and 5`
  and the tab bar. Three fail:
  - `button · Discuss`: x +6, w -8.
  - `toolkit`: y +36, h +255.
  - `kind badge`: w +6.2 (90 against Figma's 84).
- Rules: two `hiddenOverflow` findings: the `DetailFrame`'s scroll body
  (`div.scroll-frame__body`, 1069 high in 766) and the item tabs' list
  (`div.item-tabs__list`, 448 wide in 366).

## Deviations

- **Discuss.** As on M12, M19 and M22: Figma's Discuss is an icon button
  36 × 28; an icon-only `Button` is square, so Discuss is `sm`, 28 × 28,
  and starts 6 px further right (`button · Discuss` x +6, w -8). The icons
  are 16 px against Figma's 14 and 17 (gap: Item action buttons).
- **Item frame.** Figma's `toolkit` (448:343) holds the breadcrumb row and
  the item and ends at the tab bar; in `DetailFrame` the breadcrumb row is
  the ScrollFrame's header and the article is the body under it, so it
  starts 36 lower and runs to the end of the page (`toolkit` y +36,
  h +255). This is the d-107 structure that keeps the breadcrumb in view,
  as on M12 and T08.
- **Kind badge.** `KindBadge` is 90 × 24 against Figma's 84 × 21
  (`kind badge` w +6.2; gap: Kind badge 21 px). The rows under it stay
  within 3 px of Figma's y.
- **Page longer than the screen.** Figma's steps run under the tab bar and
  past the frame's foot (`steps` ends at 1059 in an 844 frame); the
  render's page does the same in the `DetailFrame`'s scroll body, so the
  rule reports the scrolled part (`hiddenOverflow` on
  `div.scroll-frame__body`). The tab bar lies over the page, as Figma
  draws it (library 1.0.0-beta.26); the library's bar is translucent, so
  step 6 shows faintly through it, where Figma's bar hides it.
- **Item tabs.** As on M12: Activity runs past the 390 px screen in Figma
  and in the render; the list's sideways scroll is the second
  `hiddenOverflow` finding (`div.item-tabs__list`). The selected tab's
  outline is `border.selected` at half alpha where Figma's is solid cyan
  (d-050).
- **Connectors.** As on T08, the library draws each connector:
  `FlowLine` down between stages and `FlowBranch` for the fork into steps
  4 and 5 and the join out of them, 24 high from the card over them as
  Figma's elbows (464:559, 464:561), each tip 2 before its card. Figma's
  straight arrows are 14 px icons; the library's head is a 6 px chevron on
  the line (gap: Workflow page flow). Every card is within 4 px of
  Figma's y.
- **Step cards.** The cards use the FlowDiagram card's tokens (gap:
  Workflow page flow): the mark is a 22 px `Badge` against 19 and the
  title 14 px (`label`) against 13; the lines start 13 from the card's
  left, as in Figma, so step 5's note wraps as Figma's does. The selected
  card (step 4) has the selected fill as well as the cyan border.
- **Breadcrumb.** As on M12 and T08: `BackRow` (Toolkit, 16 px label and
  18 px chevron against 14 px and 16 px) and the crumbs as text in
  `labelLg` (gap: Item breadcrumb), so the crumbs are a little larger than
  Figma's. On the phone the row leaves out Workflows, as Figma's does.
- **Step details.** Figma's M9 has no details panel under the steps (the
  note says a tap on a step shows its details), so the phone's page ends
  with the column; the selected step is only marked.

## Library connectors

After the move to the library's connectors, `pnpm fidelity` on every built frame of inbox, workspaces, artifacts
and toolkit (2026-11-18, library 1.0.0-beta.31) gives M09 the
same results: text passes, position fails on the same three keys and
rules on the same two `hiddenOverflow` findings.
