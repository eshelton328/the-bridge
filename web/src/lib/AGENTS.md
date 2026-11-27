# lib

Types and helpers any layer may import. Nothing here imports another
layer, a store or the router (`web/src/structure.ts`). The shapes of a
state file and a page are in `screenState.ts` (d-082).

## Rules

- In a browser test of a dialog, sheet or popover that traps the focus,
  use `expectTrapFocus()` (`focusTrap.ts`), not
  `waitFor(() => expect(…).toHaveFocus())`: `waitFor` counts clock time,
  and a busy CI runner can hold the trap's frame past its 1 s.
- After a size change (the window or a box) and before a check of what a
  ResizeObserver sets, wait with `setViewport()` or `afterRendering()`
  (`rendering.ts`): Chromium delivers the observer's notes only in a
  rendering step, which a busy CI runner can delay for seconds.
- A browser test never reads the real server: `testSetup.ts` fails a test whose
  `fetch` of `/api` has no stub (`serverGuard.test.ts`). A test file that
  opens the Workspaces, Artifacts, Inbox or Projects live source, or taps
  its way to one of those homes (`/` opens the Inbox), calls
  `stubLiveServer()` at its top (`app/liveServerStub.ts`, RouteScroll
  `/workspaces?source=live`); it answers the Artifacts list with an empty
  library, the Inbox with an empty Inbox and the projects with none. A file
  that stubs `fetch` in each test and removes it in `afterEach` calls
  `answerLateServerReads()` at its top (`lateServerReads.ts`): a page's
  router can read after its test ended (WorkspacesLiveUnavailable).
- `testSetup.ts` loads every font face a test file's CSS declares before
  its tests (`loadFonts.ts`, `loadFonts.test.ts`): a browser loads a face
  only on first use, and a cold CI browser measured text in a fallback
  font (DiscussionCompactText).
- A check of a label that shows for a few seconds ("Copied" for 2 s)
  starts `holdTimers()` (`holdTimers.ts`) before the click and moves the
  clock itself: a busy runner can spend the 2 s in one click
  (`ArtifactsCopyLink.test.tsx`).
- A Vitest page action or a failed `expect.element` or `expect.poll`
  try moves the held clock by the real time it takes. Until the test
  moves that clock, press with `clickNow()` (`holdTimers.ts`) and wait
  with `renderedUntil()` (`rendering.ts`): a poll there can let a timer
  fire early, or pass a check that the clock stands still
  (`InboxPhone`, `ArtifactsCopyLink`, `WorkspacesReplyCopy`,
  `WorkspacesLiveTranscript`).
- Before a check of where an Ark popover or menu sits, and before a
  `{ force: true }` click into one just opened, wait with
  `expect.poll(() => placed(el)).toBe(true)` (`popoverPlaced.ts`): until
  zag places it, the positioner draws it 100vh above the window
  (`SkillListHeight.test.tsx`, `WorkspacesLayoutMove.test.tsx`).
- Wrap a call to React's `act()` in `inAct()` (`testRender.ts`), never
  `act()` itself: `IS_REACT_ACT_ENVIRONMENT` stays off outside it. With it
  always on, React wrote a warning with a component stack for each update
  that a real click or key caused, 36 872 in one CI shard, and a click took
  5 to 8 s (the-bridge #322, `testRender.test.tsx`).
- An `afterEach` that changes the viewport first calls
  `await unmountRendered()` (`testRender.ts`): a resize with the app still
  mounted lays it all out again. `testSetup.ts` fails such a test
  (`viewportGuard.test.ts`).
- A loader names its state type, `readState<ScreenState<Data, Ui>>(…)`
  (`dataSource.ts`). Inferred from a page's states, the type is a union
  of every state's literal type, which made the lint take 23 s and a
  1.39 GB heap on the Inbox loader.
- Layout widths come from the shell's size tokens (`viewport.ts`); the
  library has no breakpoint tokens.
- `skillQuery.ts`'s speed after a long paste is tested in Node
  (`scripts/skillQuery.test.ts`); run `pnpm test:scripts` after you
  change it.
- With no `?state=`, and always in a production build, a loader reads
  the page's home; read [../pages/AGENTS.md](../pages/AGENTS.md) for it.
- A query retries at most twice, only on a network error, a 5xx, a 408
  or a 429; a query or mutation that fails for good goes to the sink that
  `errors/globalHandlers.ts` sets, since lib may not import errors
  (`queryClient.test.ts`, audit W-7).
- `inboxClient.ts` reads the Inbox list (`readInboxList`) and follows the
  event stream (`watchInboxChanges`, which connects again on the R70
  backoff of `reconnectBackoff.ts`) with the quiet iOS resume of
  `pageResume.ts`; `inboxFeed.ts` holds the context that
  `app/InboxFeedProvider.tsx` fills, and the hooks a page entry uses
  (`useInboxBadge`, `useInboxChanges`). Without the provider, as in a
  route test, a page keeps its own number and the Inbox page its own
  stream.
