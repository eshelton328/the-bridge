# lib

Types and helpers any layer may import. Nothing here imports another
layer, a store or the router.

- `screenState.ts`: `ScreenState`, `FigmaFrame`, `PageDefinition` and
  `checkState()`, the shapes of a state file and a page (d-082).
- `board.ts`: a canvas board, one state of one page.
- `testRender.ts`: renders a component in a Vitest browser test.
