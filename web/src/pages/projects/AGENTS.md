# Projects page

The Projects app's home (f-008 increment one, d-133): one card per brain
project, the pinned ones first. Its frames are PNG references in
`references/projects/` (D10, T10, T10b, M10), read with
[../AGENTS.md](../AGENTS.md) and `references/AGENTS.md`.

## Rules

- `ProjectsPage.tsx` keeps what the owner changes (the open ⋯ menu, the
  More drawer) in `useState`, for the shown `?state=` only.
- The page shows its fixtures only: the loader reads no server, and a pin
  changes nothing.
- Never change `AppRail`, `AppTabBar`, `MoreDrawer` or another shared
  block from this page. Write the difference in the frame's
  `references/projects/<frame>/deviations.md`.
- A part or value the library cannot draw is a row in `LIBRARY_GAPS.md`;
  use the part under "Used now" and list the difference in the frame's
  `deviations.md`.
- New project and Edit details show as the frames draw them and do
  nothing: both are increment four (d-133). A card opens no project page.
- The home's route test is `app/ProjectsHome.test.tsx` (every menu closed
  at 1512, 744 and 390 px). Run it after a change to `home.ts`, the loader
  or a screen.
- The rail, the tab bar and the More drawer open `/projects` through
  `lib/navRoutes.ts` (R1); `app/ProjectsRoute.test.tsx` taps each one.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change a screen
  or its stories.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block of this page.
- [states/AGENTS.md](states/AGENTS.md): read before you add a state or
  change the screen map.
