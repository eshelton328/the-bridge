# lib

Types and helpers any layer may import. Nothing here imports another
layer, a store or the router.

- `screenState.ts`: `ScreenState`, `FigmaFrame`, `PageDefinition` and
  `checkState()`, the shapes of a state file and a page (d-082).
- `board.ts`: a canvas board, one state of one page.
- `testRender.ts`: renders a component in a Vitest browser test.
- `focusTrap.ts`: `expectTrapFocus()`, which waits for the frame after a
  library focus trap moves the focus, then checks the focus once. Use it,
  not `waitFor(() => expect(…).toHaveFocus())`, for a dialog, sheet or
  popover that traps the focus: `waitFor` counts clock time, and a busy
  CI runner can hold the trap's frame past its 1 s.
- `viewport.ts`: `viewportForWidth()`, the layout (desktop, tablet or
  phone) for a width. The library has no breakpoint tokens, so the
  widths come from the shell's size tokens: rail + list pane + detail
  (1232) for the desktop, one list pane (420) for the tablet.
- `copyText.ts`: `copyText()`, which copies text to the clipboard when
  the page has one and copies nothing (and throws nothing) when not.
- `skillQuery.ts`: `skillQuery()`, the word before the caret when it
  starts with "/", which opens and filters the skill list. Its speed
  after a long paste is tested in Node (`scripts/skillQuery.test.ts`).
- `screenMap.ts`: a page's screen map type (`ScreenMap`, each screen's
  state per device), `frameSizes` (the Figma frame of each device, which
  Storybook's viewport menu also reads) and `screenMapProblems()`, which
  a page's `states/screens.test.ts` runs: every state in exactly one
  screen, on a device its Figma frame is.
- `containerSize.ts`: the library `Container` size of a detail column
  for each layout.
