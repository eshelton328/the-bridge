# D05 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D05 T05 M07`, then `pnpm fidelity toolkit`,
2026-11-18, against the installed library 1.0.0-beta.42), each with its
reason. The library gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`.
The state is `web/src/pages/toolkit/states/skillDiscuss.ts`: D3's data
(`skillOpen`) with writer's discussion open (`ui.discussOpen`) and no
Used in workflows section. The frame's `exceptions.json` holds only
icon sizes (Deviations).

## Checks

- Text: pass. Every Figma string is in the render and visible, and no
  render text is extra.
- Position: 24 of 41 layers pass, among them the rail's items,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, the title `432:1461`, `path row`, `columns`,
  `side panel · Discuss writer`, `header`, the note `438:15`, `context`,
  `message · Erik`, `message · Claude`, `sources`, `button · Copy` and
  `composer`. 17 fail; the first 13 are the item's Overview, which D03
  draws with the same offsets.
- Rules: pass.

## Deviations

- **Overview columns.** As on D03: the preview is 554.4 px wide against
  Figma's 560 and the side column 369.6 against 364, so the side starts
  5.6 px further left; the rows sit 2 px higher (gap: Item overview
  columns). `file preview` y -2 w -5.6, `preview bar` w -5.6,
  `rendered markdown` w -5.6, `side` x -5.6 w +5.6, `evals link` x -5.6
  w +5.6.
- **File lines.** As on D03, every line of the files list starts 5.6 px
  further left with the side column, and the lines with several names are
  about 11 px narrower (gap: Item file summary): `files` x -5.6 w -10.8,
  `file · SKILL.md` x -5.6, `file · references/` x -5.6,
  `file · artifact.md  chat.md  doc.md` x -5.6 w -12.2,
  `file · examples.md  prd.md  ticket.md` x -5.6 w -11.8,
  `file · scripts/` x -5.6,
  `file · check  ste-dict  ste-stop-hook  test-check` x -5.6 y -4
  w -10.8.
- **Description width.** As on D03, the description is 948 px wide, the
  content width, against Figma's 940 (`432:1462` w +8); its two lines
  break at the same word.
- **Open in Workbench and close.** The header's Open in Workbench is the
  md `Button`, 176 × 32 against Figma's 171 × 34, and close is an
  icon-only `text` Button 24 px square where Figma draws a bare 17 px ×,
  so the button starts 11 px further left (`button · Open in Workbench`
  x -11.2 w +5.2; gap: Discussion nav button). It is disabled with a
  title (`aria-disabled`): no Workbench state takes a toolkit chat, and
  no Toolkit frame draws where the chat lands.
- **Cited files.** Each cited file is a `MetaChip size="sm"`, 207.6 ×
  24 against Figma's 221 × 25 (`source · skills/writer/SKILL.md:106`
  w -13.4, `source · agents/writing-reviewer.md` w -13.4; gap: Cite
  chip). The chips take no tap: no frame draws where a cite opens.
- **Model chip.** In the reply box the `ModelChip` sits 6 px nearer the
  attach button and is 26 high against 29 (`model` x -6; gap:
  Discussion model chip).
- **Reply box.** Figma draws the reply box focused, with a light-blue
  #49a8c4 border. The story focuses it, and `Composer` draws its focus
  border, `border.selected` over its fill, a darker #3a819d (gap:
  Composer focus). The box is
  78 high against Figma's 82, with 28 px attach and Send buttons against
  30, so its top edge sits 3 px lower; the attach button's clip is 16 px
  against 14 (gap: Composer size). The attach button does nothing: no
  file flow is designed, and `Composer` draws the button only with
  `onAttach`.
- **Context row and name.** The attached path (438:19) and the item's
  name in the header (438:7) are mono 12, as Figma's.
- **Copy. Copy writes the answer's text to the clipboard through
  `ToolkitPage`, as the path badge's copy does.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px
  (432:1225) where the other rail icons are 22; the shared AppRail draws
  every item's icon at 24 (d-100), so the render's icon is 24 and
  `exceptions.json` names 432:1225 (bridge-coord's shared decision,
  2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (432:1230)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 432:1230, as for `icon/artifacts`.
- **Message author mark.** Figma's `icon/claude` (438:29) is 15 px;
  `Message markSize="16"` (library #229) draws it at 16, within the
  icon check's 2 px.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
