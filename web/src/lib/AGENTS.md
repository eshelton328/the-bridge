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
- `rendering.ts`: `afterRendering()`, which waits for two rendering
  steps, and `setViewport()`, `page.viewport()` and then
  `afterRendering()`. Use them after a size change (the window or a
  box) and before a check of what a ResizeObserver sets: Chromium
  delivers the observer's notes only in a rendering step, and on a busy
  CI runner the test iframe can get no rendering step for seconds while
  `expect.poll` counts its 1 s.
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
  screen, on a device its Figma frame is. A state with frames on two
  devices (Inbox `list`: T1, M1) fills both devices of its screen.
- `dataSource.ts`: the data source layer. `readState()` gives a page
  loader its state from the source `?source=` names: `fixtures` (the
  state files, the default), or `mock-api` and `live`, which are not
  built yet and return a `notBuilt` miss. An unknown source or state is
  a miss too. With no `?state=`, and always in a production build, it
  reads the page's home (`pages/AGENTS.md`). The loader throws a miss
  as `notFound({ data })`. A loader names the state type,
  `readState<ScreenState<Data, Ui>>(…)`: inferred from a page's states,
  it is a union of every state's literal type, and the lint's
  `no-unsafe-enum-assignment` then took 23 s and a 1.39 GB heap on the Inbox loader.
- `searchHref.ts`: `searchHref()`, an address with some search params
  set or removed and the rest kept, for `navigate({ href })`.
- `containerSize.ts`: the library `Container` size of a detail column
  for each layout.
- `wideDetail.ts`: `useWideDetail()`, whether the shell detail around an
  element is at least `shell.detailWideFrom` (1600 px) wide, where the
  library `Container size="detail"` widens. For what CSS cannot change
  at that width, such as a `Clamp`'s line count (R2).
- `compactPadding.ts`: the tablet and phone `Container` padding as a
  class, for a chat's `ScrollFrame` that must be the shell detail's own
  child, so AppShell docks its reply box on the keyboard (R21).
