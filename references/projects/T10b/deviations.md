# T10b deviations

What still differs from the frame after round 3 of the fidelity loop
(`pnpm fidelity projects T10b`, 2026-11-27, and again after the
blind review's findings, against the installed library
1.0.0-beta.135), each with its reason. The library gaps are in
`web/src/pages/projects/LIBRARY_GAPS.md`.

## Checks

- PNG reference: text, position and icons are not run.
- Rules: pass.
- Review: a blind `fidelity-reviewer` record with no P1 or P2 finding,
  sealed in `review.json`.

## Deviations

- **New project** shows as the frame draws it and does nothing: making a
  project is increment four, as it needs a back-end script for the brain
  and the folders (d-133, f-008 increment one, Out of scope).
- **Edit details** shows in each card's ⋯ menu and does nothing: editing a
  project's details is increment four (d-133).
- **Pin icon.** The library has no pin icon, so a pinned card shows the
  16 px pill "Pinned" after its name, which keeps the name's line
  height, so its name and purpose sit level with the other cards' (`LIBRARY_GAPS.md`, Pin icon).
- **Tile.** The letter tile is shorter than the frame's and its letter is
  the `heading` style, smaller than the frame's; no token has the frame's
  height or letter size (`LIBRARY_GAPS.md`, Project tile).
- **Purpose.** The purpose is a `bodySm` paragraph in the card's meta row,
  as the library's `Card` description shows only one or two lines
  (`LIBRARY_GAPS.md`, Card description).
- **Purpose wraps.** The purpose is `bodySm` (13/20), whose glyphs are
  about 4 % narrower than the frame's (`LIBRARY_GAPS.md`, Purpose text
  style); with the tablet layout's two wider columns the lines break at
  other words than the frame's in any case.
- **Unpin.** A pinned card's menu says Unpin in place of Pin to top. No
  frame draws a pinned card's menu.
- **Owner's name.** NCC-1701's purpose starts "The owner's personal
  workspace" in the state file, where the frame has the owner's name: the
  secret scan's personal-term rule keeps the name out of `web/`. The live
  home shows the brain's own words.
- **Cards heading.** A heading "All projects" that only a screen reader
  reads sits between the page title and the cards, so the heading levels
  go 1, 2, 3 (the stories' accessibility check). No frame draws it.
- **Layout.** At 1133 px the iPad in landscape is narrower than the
  desktop layout's 1232 (`lib/viewport.ts`), so it draws the tablet layout,
  as Settings T3 does: the tab bar in place of the frame's rail, and two
  columns of cards in place of the frame's three (`LIBRARY_GAPS.md`, Card
  grid columns). The tab bar is the shared one in the default order: Home,
  Inbox, Workspaces, Projects, Artifacts and More.
- **Purpose.** Each purpose shows whole; the frame cuts it at three lines
  (`LIBRARY_GAPS.md`, Card description).
