# Projects page

The Projects app's home (f-008 increment one, d-133): one card per brain
project, the pinned ones first; and a project's page (`/projects/<slug>`,
R4). Its frames are PNG references in `references/projects/` (D10, T10,
T10b, M10 for the home, D01, T01, T01b, M01 for a project's page), read with
[../AGENTS.md](../AGENTS.md) and `references/AGENTS.md`.

## Rules

- `ProjectsPage.tsx` keeps what the owner changes (the open ⋯ menu, the
  More drawer) in `useState`, for the shown `?state=` only.
- Never change `AppRail`, `AppTabBar`, `MoreDrawer` or another shared
  block from this page. Write the difference in the frame's
  `references/projects/<frame>/deviations.md`.
- A part or value the library cannot draw is a row in `LIBRARY_GAPS.md`;
  use the part under "Used now" and list the difference in the frame's
  `deviations.md`.
- New project and Edit details show as the frames draw them and do
  nothing: both are increment four (d-133). A card opens no project page
  yet.
- A project's page is `ui.open` on the same state, so it shares the
  home's data and screen. It shows the header and the tabs of increment
  one, Overview and Ideas (d-133); their panels are NCC-130's and
  NCC-132's, and Quick chat does nothing yet. Its route comes next.
- In development the home reads the live projects (`liveProjects.ts`), as
  the Artifacts home does (d-117): with no `?state=` and no `?source=`, and
  with `?source=live`; `?source=fixtures` shows the sample data, and a
  `?state=` its fixture state.
  - `GET /api/projects` fills the cards in the server's order: the pinned
    ones first, then by name (R2). A list that misses shows no projects,
    never the sample ones, and one line ("Projects not read — the server
    answered 500").
  - Pin to top (Unpin on a pinned card) sends `PUT /api/projects/:slug/pin`
    and then reads the list again, so the card moves (R3). The server keeps
    the pins, so they stay after a reload and on each device. A pin that
    misses keeps the order and shows one line ("Not pinned — the server did
    not answer"). On fixtures a pin does nothing.
  - report() gets only a miss the server answered, as `ProjectsMissError`
    with its step, kind and status, never a name.
- The home's route test is `app/ProjectsHome.test.tsx` (every menu closed
  at 1512, 744 and 390 px, on `?source=fixtures`). Run it after a change
  to `home.ts`, the loader or a screen.
- The rail, the tab bar and the More drawer open `/projects` through
  `lib/navRoutes.ts` (R1); `app/ProjectsRoute.test.tsx` taps each one.
- `app/ProjectsLive.test.tsx` covers the live home (R2, R3, the misses)
  with the fake `lib/fakeProjectsServer.ts`.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change a screen
  or its stories.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block of this page.
- [states/AGENTS.md](states/AGENTS.md): read before you add a state or
  change the screen map.
