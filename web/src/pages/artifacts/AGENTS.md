# Artifacts page

The Artifacts library: every Claude artifact and Codex site in one grid.
Its Figma frames are `D*` (desktop), `T*` (tablet) and `M*` (phone) on
the Artifacts page; their saved copies are in `references/artifacts/`.

## Rules

- `ArtifactsPage.tsx` keeps what the owner changes in `useState`, for
  the shown `?state=` only. When a change must outlive a visit, move it
  to an `artifactsStore.ts` made with `createAppStore` (d-083).
- Never change `AppRail`, `AppTabBar`, `MoreDrawer` or another shared
  block from this page. Write the difference in the frame's
  `references/artifacts/<frame>/deviations.md`.
- A part the library cannot draw is a row in `LIBRARY_GAPS.md` for the
  batched library PR. Until it ships, use the part the row names under
  "Used now" and list the difference in the frame's `deviations.md`.
- Pure view logic goes in `screens/<name>View.ts`, with its test
  `<name>View.test.ts` in this folder.
- An opened card shows `data.open` when the state has one; any other
  card's detail is built from its own card fields (`cardDetail` in
  `screens/openView.ts`, `openView.test.ts`). The home has no
  `data.open`.
- The Back bar and the discussion header stay at the top and the reply
  box at the bottom; only the content between them scrolls (d-107,
  `app/ArtifactsStickyBars.test.tsx`).
- Every card and open artifact has a `link` (`types.ts`). Copy link
  goes out through the screen's `onCopyLink`; the entry writes the
  clipboard and passes back `copiedLink`, which the control shows as
  Copied or Copy failed for 2 s (audit W-6,
  `app/ArtifactsCopyLink.test.tsx`, which opens from the list).
- Each rich block (the preview, each thumbnail, each discussion entry)
  sits in its own `BlockBoundary`, keyed by its id; a fallback under a
  title button's cover is lifted over it (d-084,
  `ArtifactBlockBoundaries.test.tsx`, `ArtifactThumbnailRetry.test.tsx`).
- On the phone, More opens Artifacts and stays selected (d-105).
- The phone's keyboard is the device's own: a state draws none and keeps
  the tab bar, as Figma does (d-089).
- The discussion blocks use the same library parts as the Inbox's
  discussion blocks; copy the pattern, never import the Inbox page.
- In development the home reads the live library (`liveArtifacts.ts`,
  `liveLibrary.ts`), as the Workspaces home does (d-117): with no
  `?state=` and no `?source=`, and with `?source=live`;
  `?source=fixtures` shows the sample data, and a `?state=` its fixture
  state. The server's `GET /api/artifacts` fills every card, count,
  project and the status line; only the Discussion and its proposals stay
  sample, as no route has them. The server has no preview, so a Claude
  artifact draws the `doc` thumbnail and a Codex site the `ui` one; an
  artifact in no project is `noProject`, and its meta line names none.
  - A visit's first list fixes what is New (the server's `lastSeenAt`
    then); the page then posts `POST /api/artifacts/seen` once, and every
    list of the visit keeps those marks.
  - A list with `partial: true` shows what came, says "Checked part of
    Claude — the rest comes next", and the page reads once more; a second
    partial list waits for the next list the owner causes. No read runs
    on a timer.
  - A miss shows no artifacts, never the sample ones, and one line in the
    status line by status ("Library not read — the server answered
    500"). report() gets only a miss the server answered, as
    `ArtifactsMissError` with the step, kind and status. A read with no
    answer around a trip to the background is quiet and goes again once
    the page shows (`lib/pageResume.ts`).
  - The writes (`useArtifactWrites.ts`): Add a link posts
    `POST /api/artifacts` with what the form holds (`screens/addLinkView.ts`:
    `https://` before a link typed without it, the source read from the
    link unless picked, null for Not in a project). A 201 closes the form
    and the list shows the link as found; a 200 (a link the library has)
    closes it and opens that artifact. A project pick (the chip's menu, the
    phone's sheet) sends `PATCH /api/artifacts/:artifact`; Remove (the
    bar's, the tablet's, the sheet's) sends `DELETE`, and a 404 is gone
    already. One write at a time; each that goes through reads the list
    again. A miss keeps the page as it was and shows one line by status:
    under Add a link's link field ("Not added — the server answered 500";
    a 400 "Not added — check the link and the title"), else in the open
    artifact's status line and, on the phone, in File in a project's sheet,
    which hides the page under it. report() gets only an answered miss
    other than a 400 add or a 404, with its step, kind and status. No
    Figma frame draws these lines; they use the status line's own text
    and the library's `TextField error`.
  - Tests: `liveLibrary.test.ts`, `addLinkView.test.ts`,
    `app/ArtifactsLive.test.tsx` and `app/ArtifactsLiveWrites.test.tsx`
    (the owner's path, with the fake `lib/fakeArtifactsServer.ts`). An
    artifact made inside a REPL script writes no Artifact record, so the
    server never finds it; the owner adds it with Add a link.
- The route tests are in `app/`: `ArtifactsRoute.test.tsx`,
  `ArtifactsHome.test.tsx` (the home at 390, 756 and 1512 and on a
  resize) and `ArtifactsHomeOpen.test.tsx`. Run them after a change to
  `home.ts`, the loader or a screen.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you add or change
  a screen, a story or a view helper.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block of this page.
- [states/AGENTS.md](states/AGENTS.md): read before you add or change a
  state or the screen map.
