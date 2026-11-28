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
- Edit details shows as the frames draw it and does nothing (increment
  four, d-133). A click on a card opens its project's page.
- New project (increment four, NCC-162) opens its form, plain on every
  size (`useNewProject.ts`, `blocks/NewProjectForm.tsx`): a dialog on the
  desktop, a full screen with no tab bar on a tablet or phone. Each name
  change reads `GET /api/projects/-/slug`; only the newest answer counts,
  and Create project is off until the folder is free. Create project and
  the picture are the next commit's. On fixtures no read goes out.
  `app/ProjectsNewProject.test.tsx` checks it at 1440, 1024 and 390 px.
- A project's page is `ui.open` on the same state, so it shares the
  home's data and screen. It shows the header and the tabs Overview,
  Repositories (increment two) and Ideas (d-133). The Overview draws the Inbox and Queue
  panels (R5, R6) from `data.overview`: the overview states' rows, or
  the live page's from the server; with none it draws no panel.
  `ProjectPage.tsx` is its
  entry, on the route `projects_.$slug.tsx` (not nested in `/projects`);
  `loadProjectState.ts` reads it as the home's loader does, and a slug with
  no project is not found. `app/ProjectPageRoute.test.tsx` opens it from a
  card at 1440, 1024 and 390 px.
- Quick chat (R8) is `liveQuickChat.ts`, whose header has its rules, and
  works on the live project only. `app/ProjectQuickChat.test.tsx` checks
  it at 1440, 1024 and 390 px with the fakes: never a real chat.
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
  - A project's page reads `GET /api/projects/:slug` and shows that
    project. A 404 is not found; another miss shows the home with one line
    ("Project not read — the server answered 500").
  - The same read fills the Queue panel with the project's open PRs, and
    the Inbox panel reads `GET /api/inbox` for the project's items that
    need the owner, and under "To review" its done chats (a chat item names
    its pane's tagged project). The page reads it again on
    each `inbox.changed` through `useInboxChanges` (no timer, NCC-138):
    one read when the page opens from the home, two on a cold load (the
    loader and the feed's stream open), then one per change
    (`app/ProjectOverviewPanels.test.tsx`). The server gives its kept PRs
    at once and runs gh behind the read; on `projects.changed` the page
    runs its loader again, so new PRs show with no reload (NCC-156).
  - The Ideas tab (R10; NCC-132's live slice, plain on every size) is in
    the address, `?tab=ideas`, so a reload and Back keep it. Only then
    does the loader read `GET /api/projects/:slug/ideas`; the Overview
    reads none. A list that misses shows one line ("Ideas not read — the
    server answered 500"). `app/ProjectIdeasLive.test.tsx` checks it at
    1440, 1024 and 390 px with the fake.
  - The same read fills the Context drift panel (R9) from
    `GET /api/projects/:slug/drift`. Run check's POST answers when the check
    ends (at most 60 s), so it waits 75 s; the server keeps no busy state, so
    `ProjectPage.tsx` keeps Run check off until the answer. A miss shows one
    line and keeps the last check (`app/ProjectDrift.test.tsx`).
  - The Chats panel (R7) reads `GET /api/projects/:slug/chats` with the
    page, and again on `inbox.changed` only while the merged `ui.tab` is
    Overview, one read at a time (`app/ProjectChatsPanel.test.tsx`). A tag
    change shows after a page open until NCC-139; NCC-149 moves the reads.
    The search, the area chips and the 10-row pager work on the rows read
    (`app/ProjectChatsTable.test.tsx`); a read that missed shows no count.
  - The Repositories tab (increment two; the live slice, plain on every
    size) is `?tab=repositories`. Only then does the loader read
    `GET /api/projects/:slug/repositories`: one row per repository, its
    role, visibility and newest release, its open PR and worktree counts,
    and the line of each part not read. A miss shows one line
    ("Repositories not read — the server answered 500").
    `app/ProjectRepositoriesLive.test.tsx` checks it at 1440, 1024 and
    390 px with the fake.
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
