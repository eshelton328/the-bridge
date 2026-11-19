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
