# blocks

Props-only parts that only the Toolkit page draws. A part that a second
page needs moves to `web/src/blocks/`.

- A component file is `Toolkit<Part>.tsx` and exports `Toolkit<Part>`.
  Start one with `pnpm new block Toolkit<Part> --page toolkit`.
- A pure helper is a camelCase `.ts` file with its test at the page
  root; a React hook is
  `use<Name>.ts`.
- Draw with library parts. A part the library lacks goes in
  [../LIBRARY_GAPS.md](../LIBRARY_GAPS.md); never build it by hand here.
- Copy a press out through a prop (`onCopy`); only the page entries
  (`ToolkitPage.tsx`, `ToolkitPending.tsx`) write the clipboard.
- Wrap each `MarkdownView`, `CodeLines`, `MapGraph` and chart in
  `BlockBoundary`, keyed by what it shows (d-084 level 4,
  `app/ToolkitBlockBoundary.test.tsx`).
