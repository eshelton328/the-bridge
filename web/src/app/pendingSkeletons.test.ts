import { describe, expect, it } from 'vitest'
import artifacts from '../pages/artifacts/ArtifactsPending.tsx?raw'
import inbox from '../pages/inbox/InboxPending.tsx?raw'
import toolkit from '../pages/toolkit/ToolkitPending.tsx?raw'
import workspaces from '../pages/workspaces/WorkspacesPending.tsx?raw'
import workspacesScreen from '../pages/workspaces/screens/WorkspacesScreen.tsx?raw'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): a page's loading
// screen is the page's real layout with skeletons in its rows or cards, never the generic shell with lines of text in
// the page's place. This reads each page's pending component and fails when one draws LoadingShell (its
// DetailBodySkeleton lines) or a DetailBodySkeleton of its own. The pages not moved yet are listed, and the list
// must only shrink: a page that left LoadingShell fails here until it leaves the list.
// The Workspaces pending component draws its screen with `loading`, so the check reads both.
const sources: Readonly<Record<string, string>> = {
  artifacts,
  inbox,
  toolkit,
  workspaces: `${workspaces}\n${workspacesScreen}`,
}

// Every pending component in the pages, so a new one must join `sources`.
const found = import.meta.glob('../pages/*/*Pending.tsx', { eager: true })

/** R58 step 3 (bridge-coord, 2026-11-23): Toolkit moves next. */
const notYet = new Set(['toolkit'])

const pageOf = (path: string) => /\.\.\/pages\/([^/]+)\//.exec(path)?.[1] ?? path
const generic = (source: string) => /\bLoadingShell\b|\bDetailBodySkeleton\b/.test(source)

describe("each page's loading screen (R58)", () => {
  it('reads every pending component', () => {
    expect(Object.keys(found).map(pageOf).sort()).toEqual(Object.keys(sources).sort())
  })

  for (const [page, source] of Object.entries(sources)) {
    if (notYet.has(page))
      it(`${page} still waits for its own skeleton: take it off the list once it has one`, () => {
        expect(generic(source)).toBe(true)
      })
    else
      it(`${page} draws its own layout, not the generic shell's text lines`, () => {
        expect(generic(source)).toBe(false)
      })
  }
})
