import { describe, expect, it } from 'vitest'
import artifacts from '../pages/artifacts/ArtifactsPending.tsx?raw'
import inbox from '../pages/inbox/InboxPending.tsx?raw'
import toolkit from '../pages/toolkit/ToolkitPending.tsx?raw'
import workspacesPage from '../pages/workspaces/WorkspacesPage.tsx?raw'
import workspacesScreen from '../pages/workspaces/screens/WorkspacesScreen.tsx?raw'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): a page's loading
// screen is the page's real layout with skeletons in its rows or cards, never the generic shell with lines of text in
// the page's place. This reads each page's pending component and fails when one draws the old LoadingShell (removed
// in R58) or a DetailBodySkeleton, the library's lines of text. Toolkit, which reads no server, draws its real home.
// Workspaces has no pending component: its page draws its screen with `loading` in its own tree (NCC-181), so the
// check reads both.
const pending: Readonly<Record<string, string>> = { artifacts, inbox, toolkit }
const sources: Readonly<Record<string, string>> = { ...pending, workspaces: `${workspacesPage}\n${workspacesScreen}` }

// Every pending component in the pages, so a new one must join `sources`.
const found = import.meta.glob('../pages/*/*Pending.tsx', { eager: true })

const pageOf = (path: string) => /\.\.\/pages\/([^/]+)\//.exec(path)?.[1] ?? path
const generic = (source: string) => /\bLoadingShell\b|\bDetailBodySkeleton\b/.test(source)

describe("each page's loading screen (R58)", () => {
  it('reads every pending component', () => {
    expect(Object.keys(found).map(pageOf).sort()).toEqual(Object.keys(pending).sort())
  })

  for (const [page, source] of Object.entries(sources)) {
    it(`${page} draws its own layout, not the generic shell's text lines`, () => {
      expect(generic(source)).toBe(false)
    })
  }
})
