# D07 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity artifacts D07`, 2026-11-17, against the installed
library 1.0.0-beta.15, the version this branch pins;
checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception (`exceptions.json`).
  The context meter's `46%` (454:328) matches with no exception: since
  library 1.0.0-beta.12, `ContextMeter` draws it as one text node.
- Position: 22 of 34 layers pass, among them the artifact bar, title
  block, preview, preview footer, Open artifact, "Made in", both Open in
  workspace buttons (`452:2406`, `452:2464`), the panel's `header`,
  `button · x`, `guard`, `model and context` and `composer · discussion`.
  Twelve fail; each is
  listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (452:1993); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 452:1993 (2026-11-19, the same decision on every page's rail).
- **Artifact pane and discussion panel.** `artifact pane` w +8,
  `discussion panel` x +8, w -8. The artifact keeps D2's `Container
  size="detail"` (748 + 2 × 40 = 828) against Figma's 820 pane, so the
  panel starts 8 px further right and is 620 wide against 628. No size
  token is 628 or 820 and `AppShell` has no side column. The panel pads
  12 at the start, so its content sits at Figma's x 905, as the Inbox's
  panel. Library gaps "Discussion panel width" and "Detail column inset".
- **Discuss.** `button · Discuss` x -4.2, w +4.8: `Button textSize="sm"`
  pads its sides more than Figma's 11 px, as in D2. It is pressed while the
  discussion is open; since library beta.36 (#138) its border is
  `accent.discuss` (`pressedBorder="discuss"`), the solid violet, where
  Figma draws `border.discuss` at 50 %: that gives under 3:1 (WCAG
  1.4.11) over the pressed fill. Figma's violet fill has no token, so the
  fill stays `surface.selected`. Library gaps
  "Sort and Filter button widths" and "Discuss toggle".
- **Project chip.** `chips` w -12.8, `project · File in a project` x +6,
  w -16.8, `chip · updated 12m ago` x -10.8, as in D2: the project chip
  is a read-only `MetaChip` with no chevron. Library gap "Project chip
  menu".
- **Model and context.** Passes (218 × 26 against 220 × 22): since
  library #142 `ModelChip` is 82.2 wide against Figma's 83 and its chevron
  takes the label's tone, and "context" is `smallXs` (Regular 11/16),
  38 wide as Figma's 11 px label (454:329), in place of the 46 px wide
  `monoSm`. The chip is 26 high against 22 and the label's line 16
  against 14, on the 4 px grid (d-072). Library gap "Model chip width".
- **Discussion area.** `discussion` h -7: the library's `Composer` is a
  few px taller than Figma's 75 px reply box. The box has no clip
  button, as the Inbox's: no file flow is designed and `Composer` draws
  its attach button only with an action (library gap "Attach in the
  discussion reply box"). It shows no caret or violet focus border,
  which Figma draws (library gap "Composer focus"), and its placeholder
  is a little brighter than Figma's dim grey (452:2454): `Composer` takes
  no tone for it (library gap "Composer placeholder colour").
- **Empty state place.** `empty state` y +211, h -119, `it can` y +98,
  `suggestions` y +100. Figma puts the empty state 120 px under the top of
  the discussion area (its tile at y 264); no spacing token is larger than
  40, so the render centres it in the area, as the Inbox's D14, about 100
  px lower. The `empty state` box is Figma's frame with its 120 px top
  padding, so its y differs more. A ratio of two flex spacers placed "It
  can" and the suggestions about 15 px low, but the style system types
  allow no such flex value, so it was taken back. `suggestions` x -5.2, w
  +10.5: the three `Button textSize="xs"` are wider than Figma's. Library
  gap "Empty state with an icon tile".
- **Empty state parts.** The tile is a round `surface.raised` disc of
  44 px (`control.xl`) against Figma's 42, as the Inbox's. "It can" is a
  `Panel` with its eyebrow title; the three icons are violet
  (`accent.discuss`).
- **Artifact column.** The title is 28 px type (`heading`) against about
  26, the preview's bars are the library's chart drawing in its colours,
  not Figma's heights and colours, its window dots are about 10 px and 18
  apart against 5 and 9 (452:2374 to 452:2376) and its axis about 557
  wide, 96 in from each side, against 628 and 60 (452:2387), and the
  column starts 4 px further right, as in D2. Library gaps "Artifact title
  size", "Thumbnail colour", "Artifact preview frame" and "Detail column
  inset".
- **Discussion blocks.** The Inbox page does not export its
  `DiscussionPanel`, so the Artifacts page has its own `DiscussionPanel`
  and `DiscussionEmpty`, built from the same library parts (`ModelChip`,
  `ContextMeter`, `LockIcon`, `Panel`, `Button`, `Message`,
  `Composer`). Nothing moved into `web/src/blocks/`.
- **Buttons with no screen yet.** Open in workspace in the header and in
  "Made in" has no action (no workspace route); Copy link, Remove and
  Open artifact are as in D2. Discuss toggles the discussion, Close
  closes it, a suggestion fills the reply box and send shows the message
  in place of the empty state; nothing answers it in this mock-up.
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.

## Values picked (d-100)

Each value with no token is recorded in `LIBRARY_GAPS.md` and drawn with
the nearest library part until it lands: the side width 628 (Figma's,
on the 4 px grid; drawn 620), Discuss's pressed fill in violet (no
token; drawn `surface.selected`, its border `accent.discuss` since
beta.36), the empty state 120 px under
the area's top (Figma's; drawn centred). The panel keeps the Inbox's
paddings: 16 above and below, 12 at the start, 20 at the end, 12 between
its rows, 6 above the discussion area.
