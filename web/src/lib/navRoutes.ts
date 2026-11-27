// The route of each item a page's rail, tab bar or More drawer can pick, for
// the page entries' onNavigate. Projects opens its home (f-008, R1). Home has
// no route yet, so a pick of it goes nowhere; More opens the drawer in the
// screen, never a route, except the desktop rail's More, which each entry
// decides.

/** The routes the nav items open. */
export type NavRoute = '/inbox' | '/workspaces' | '/projects' | '/artifacts' | '/toolkit' | '/settings'

const routes: Readonly<Record<string, NavRoute>> = {
  inbox: '/inbox',
  workspaces: '/workspaces',
  projects: '/projects',
  artifacts: '/artifacts',
  toolkit: '/toolkit',
  settings: '/settings',
}

/** The route of the picked nav item `page`, or undefined for one with no route. */
export function navRoute(page: string): NavRoute | undefined {
  return routes[page]
}
