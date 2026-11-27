# Projects screens

The props-only screens of the Projects page and their stories. The entry
is `ProjectsScreen.tsx`: it lays the page out by its width
(`ViewportFrame`) with the shared rail, tab bar and More drawer, and draws
`ProjectsHome.tsx` in the shell's detail, or `ProjectDetail.tsx` (a
project's header and tabs) when `ui.open` names a card.

- `ProjectsScreen.stories.tsx` holds one story per state
  (`Pages/Projects/States`); `ProjectsScreens.stories.tsx` holds one story
  per screen of `../states/screens.ts` (`Pages/Projects/Screens`).
- The home runs under the tab bar on a tablet or phone (AppShell
  `tabBarOverlay`).
- The grid has four columns on the desktop, two on a tablet and one on a
  phone. An iPad in landscape (1133 px) draws the tablet layout, with the
  header 24 down (`_landscape`), as T10b has it, where T10 has 40.
- A hidden h2 ("All projects", `data.cardsHeading`) keeps the heading
  levels 1, 2, 3 between the page title and the cards' titles.
