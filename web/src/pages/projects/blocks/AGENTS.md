# Projects blocks

Props-only blocks that only the Projects page draws. Make one with
`pnpm new block <Name> --page projects`; a block a second page needs
moves to `web/src/blocks/`.

- `ProjectCardView` is the library `Card` with `ProjectTile` as its media
  and the ⋯ menu in the tile's top end corner. Its menu says Pin to top,
  or Unpin on a pinned card, and Edit details, which does nothing
  (increment four, d-133).
- `ProjectTile` draws the project's library icon when its `icon` names one
  in the tile's list, else the first letter of its name in capitals; its
  `picture` size is the 64 px square of a project's page.
- `ProjectHeader` is a project page's head: `BackRow` with Quick chat at its
  end, then the picture beside the name and purpose.
- Each card carries `data-figma="project card · <name>"`, which the live
  tests read for the order.
