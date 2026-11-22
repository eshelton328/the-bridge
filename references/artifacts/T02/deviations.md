# T02 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity artifacts T02`, 2026-11-17, against the installed
library 1.0.0-beta.19; checked again 2026-11-19 with 1.0.0-beta.69,
where the position result did not change), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. T2 is D2's open artifact on
the iPad mini, on its own page under a Back bar; most differences are
D2's (`../D02/deviations.md`).

## Checks

- Text: one extra text since R40 (2026-11-22): "Copy link" beside Open
  artifact (see Copy link beside Open artifact below). Nothing is missing
  or hidden.
- Position: 20 of 24 layers pass (`top bar`, `button · Discuss`,
  `button · copy`, `button · trash`, `title block`, `status`,
  `pill · New`, `chip · Claude artifact`, `project · File in a project`,
  `button · Open artifact`, `link`, `section · MADE IN`, `made in` and
  `tab bar`). Four fail;
  see below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`. Since R40, `button · Open artifact` fails too (w -137.5,
  x +2), as Copy link sits beside it.
- Rules: pass.

## Deviations

- **Project chip.** `chips` x +2, w +5.2, `chip · updated 12m ago`
  x +5.2. The project chip is a `MetaChipButton` with its chevron (Figma
  405:444) and opens the project menu; it passes, 1.2 px wider than
  Figma's, so the updated chip sits a little further right.
- **Preview.** `preview` x +2, y +3, w -6, h -3.7. The page keeps 24 px
  sides (d-100, as T1) against Figma's 22, and Figma's preview frame is
  714 wide, one px past the page on each side, so the framed
  `Thumbnail shape="wide"` is 708 × 398 against 714 × 402. The chart's
  bars are the library's `Thumbnail kind="chart"` drawing: a brighter
  cyan and violet, and other heights and order than Figma's
  (405:457 to 405:465). Since library 1.0.0-beta.74 the window bar's dots
  are 5 px and 9 apart, as Figma's (405:453 to 405:455), and the axis is
  84 % of the thumbnail's width (Figma's 598, 405:466). Library gaps
  "Thumbnail colour" and "Artifact preview frame".
- **Open in workspace.** `button · Open in workspace` x -7.5. The page is
  4 px narrower (24 px sides), and `MadeIn`'s box pads 16 at the sides
  (D2's value on the 4 px grid) against Figma's 13 here, so the button
  sits further left.
- **Artifact title.** None left: "Skill eval pass rates" is the
  library's `heading` (28/40) and Figma's is heading 28/41 (405:433),
  the line on the 4 px grid, so T2 had no gap. The desktop title takes
  `headingSm` (library 1.0.0-beta.71, library PR 222); the tablet keeps
  `heading`.
- **Link mark.** The chain-link mark before the address is the
  library's `LinkMarkIcon size="12"` (`LinkMark`, no margins), which
  fills its box as Figma's does (405:472): 12 px against Figma's 13, as
  12 is on the 4 px icon scale, in the same `fg.muted` as the address.
  The `link` layer passes. D2's mark in the preview's footer is drawn the
  same way.
- **Copy link beside Open artifact (R40, 2026-11-22).** A Copy link
  button (`CopyLinkButton size="xl"`) sits to the right of Open artifact,
  8 apart, so Open artifact is 137.5 px narrower than Figma's full-width
  button (405:467) and the render has one extra text, "Copy link". No
  Figma layer draws it. Reason: bridge-coord's decision for screen review
  R40, after Erik's "We also should be able to copy link like how we had
  it before": a Copy link next to Open artifact on every layout. The Back
  bar keeps its copy icon as Figma draws it.
- **Open artifact is a link.** Since R40 Open artifact is an `<a>` to the
  artifact's https address in a new tab, drawn with the library's
  primary `button` recipe; it looks the same as the `Button` before.
- **Buttons with no screen yet.** Discuss opens the discussion page (T4).
  Remove and the project chip act on the live library; Open in workspace
  has no action, as in D2. Back returns to the library (T1).

## Values picked (d-100)

- Page sides: 24 (Figma 22, on the 4 px grid, as T1).
- Back bar: 20 under the status bar (the tablet `Container`'s 12 and 8),
  as Figma; 36 high (`sizes.control.lg`), as Figma.
- Title block: 20 under the Back bar and the sections 20 apart (Figma 18
  each, a tie on the 4 px grid takes the larger token, d-072); the rows
  of the title block 10 apart, as Figma.
- Discuss: the 28 px `Button size="sm"` (Figma 87 × 30 with 11 px sides);
  it is the nearest in width, and the 32 px `md` was 8.8 px wider.
- Copy link and Remove: icon-only 36 px buttons (`size="lg"`), as Figma.
- Open artifact: 44 px high (`size="xl"`, Figma 46), the width the
  Copy link beside it leaves (R40).
- Link mark: `LinkMarkIcon size="12"` (Figma 13, on the 4 px icon
  scale).
