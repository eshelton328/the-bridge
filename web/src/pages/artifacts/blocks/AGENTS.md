# Artifacts blocks

Props-only blocks that only the Artifacts page uses. A block a second page
needs moves to `web/src/blocks/`.

- One component per file, named after the part it draws
  (`PascalCase.tsx`); start one with `pnpm new block <Name> --page
  artifacts`.
- Build each block from library parts. A missing part is a row in
  `../LIBRARY_GAPS.md`, never a hand-built copy.
- A sheet over the phone's library or artifact page is a `BottomSheet`
  over the tab bar. Its scrim and Escape close it and keep the choice
  (`app/ArtifactsRoute.test.tsx`).
- A menu or sheet picked with an arrow key changes the value
  (`onValueChange`) and stays open; a pick closes it (`onItemSelect`).
  `app/ArtifactsRoute.test.tsx` checks the arrow keys.
