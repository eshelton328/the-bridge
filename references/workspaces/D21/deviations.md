# D21 deviations

What still differs from Figma after the build of Rename chat
(`pnpm fidelity workspaces D21`, 2026-11-17, library 1.0.0-beta.20), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D2b's sidebar
layout without the side chat and the menu: bridge themes selected and
shown alone, Working, and the name in its header turned into a field with
the focus in it and × at its end (`renameChat`).

## Checks

- Text: fails only on `Artifacts` and `Toolkit` (text.extra, the rail,
  d-105). D01 to D20 except these two in their `exceptions.json`; this
  build could not write D21's, because the permission to add an
  exception was denied, so the caller or Erik adds it. Every Figma string
  shows, the field's `bridge themes` included.
- Position: 23 of 28 layers pass; `417:2399` and `417:2412` fail. The
  rename field (`rename field · chat`), the chat header (`417:2366`), the
  ⋯ (`417:2377`), Erik's message (`417:2394`), every sidebar row and group
  header pass.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Nav rail (`Artifacts`, `Toolkit`).** Figma's rail has no Artifacts
  or Toolkit item, so `rail · Artifacts` and `rail · Toolkit` have no
  layer, and `rail · More` sits 108 px lower (y +108). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.
- **Rename field text and × (Rename field).** The library has no rename
  field; `ChatNameField` is `SearchField size="sm"`, 300 wide. Its name is
  14 px body text where Figma's is 16 px (`subtitle`), it starts 10 px in
  where Figma's starts 7, and its × is the thin `CloseIcon` at 16 px in
  `fg.subtle`, where Figma's is 15 px and lighter. The field is 28 high
  against 29 and has the cyan focus border, as in Figma. The text caret
  shows only in a live browser; the screenshot has none.
- **Main chat reply (Message text).** `417:2399` y -6, h +7: the reply
  wraps in body text (14/20) and Copy is 24 px (Figma 22), as on D01 to
  D20. It starts 6 px higher: the header is a few px shorter than Figma's
  (within the tolerance), as the field (28) and the workspace line stack
  with no gap, where Figma leaves 2 px and draws the field 29 high, and
  the lines above the reply are each a little shorter.
- **Composer is taller.** `417:2412` h +7: `Composer`'s attachment chip,
  20 px text line and 28 px buttons make it 7 px taller than Figma's, as
  on D02b and D15 to D20; its top is 4 px lower.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b and D16 to D20: the ⋯ is a `Button size="xs"` (24 px) against
  30 × 22, and the group header buttons are 24 px with 12 px icons.
- **Attachment remove × (Composer attachment remove).** Figma's × on
  theme-ideas.md is bold; `Composer` draws its own thin `CloseIcon`.
- **Composer text (Composer text).** The placeholder is `body` (14)
  against Figma's Regular 13 (417:2421), and Stop is `Button size="sm"`
  with a 14 px label against Figma's 11 px (417:2434).
- **Sidebar drift (Sidebar group header, Sidebar chat row).** Every
  sidebar header and row passes the position check within 4 px; the
  selected row and the lower headers sit 2 to 5 px off Figma's, the 2 px
  that each row (52 against 50) and header (30 against 28) adds, as on
  D16.
- **Group header icons (Sidebar group header).** Figma's rename and
  close on the OMNI header (D21 417:2326, 417:2329) are 13 px outline
  icons with a 2 px stroke, so they look heavy; `EditIcon` and
  `CloseIcon` at 12 px draw a 1 px stroke, and no icon takes a stroke
  weight.
