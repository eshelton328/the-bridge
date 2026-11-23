import { describe, expect, it } from 'vitest'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): a page's loading
// screen is the page's real layout with skeletons in its rows or cards, never the generic shell with lines of text in
// the page's place. This reads each page's pending component and fails when one draws LoadingShell (its
// DetailBodySkeleton lines) or a DetailBodySkeleton of its own. The pages not moved yet are listed, and the list
// must only shrink: a page that left LoadingShell fails here until it leaves the list.
const pending = import.meta.glob<string>('../pages/*/*Pending.tsx', { query: '?raw', import: 'default', eager: true })

/** R58 steps 3 and 4 (bridge-coord, 2026-11-23): Toolkit and Workspaces move next. */
const notYet = new Set(['toolkit', 'workspaces'])

const pageOf = (path: string) => /\.\.\/pages\/([^/]+)\//.exec(path)?.[1] ?? path
const generic = (source: string) => /\bLoadingShell\b|\bDetailBodySkeleton\b/.test(source)

describe("each page's loading screen (R58)", () => {
  it('finds the pending components', () => {
    expect(Object.keys(pending).map(pageOf).sort()).toEqual(['artifacts', 'inbox', 'toolkit', 'workspaces'])
  })

  for (const [path, source] of Object.entries(pending)) {
    const page = pageOf(path)
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
