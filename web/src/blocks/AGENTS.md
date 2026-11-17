# blocks

Blocks that two or more pages use (d-088, d-089): composites of library
parts, such as `AppRail`. A block starts in its page's `blocks/` and moves
here when a second page needs it.

## Rules

- Props-only: data in as props, changes out through callbacks. No
  store, router, `fetch` or storage; the lint rejects them.
- A block never imports a page.
- Wrap rich content that can fail to render (markdown, code, charts) in
  `BlockBoundary` from `errors/`.
