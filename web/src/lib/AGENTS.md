# lib

Types and helpers any layer may import. Nothing here imports another
layer, a store or the router.

- `screenState.ts`: `ScreenState`, `FigmaFrame`, `PageDefinition` and
  `checkState()`, the shapes of a state file and a page (d-082).
- `board.ts`: a canvas board, one state of one page.
- `testRender.ts`: renders a component in a Vitest browser test.
- `viewport.ts`: `viewportForWidth()`, the layout (desktop, tablet or
  phone) for a width. The library has no breakpoint tokens, so the
  widths come from the shell's size tokens: rail + list pane + detail
  (1232) for the desktop, one list pane (420) for the tablet.
- `containerSize.ts`: the library `Container` size of a detail column
  for each layout.
