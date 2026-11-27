# Projects blocks

Props-only blocks that only the Projects page draws. Make one with
`pnpm new block <Name> --page projects`; a block a second page needs
moves to `web/src/blocks/`.

- `ProjectCardView` is the library `Card` with `ProjectTile` as its media
  and the ⋯ menu in the tile's top end corner. Its menu says Pin to top,
  or Unpin on a pinned card, and Edit details, which does nothing
  (increment four, d-133). With `onOpen` a click on the card opens its
  project's page; the ⋯ button lifts over the card's button.
- `ProjectTile` draws the project's library icon when its `icon` names one
  in the tile's list, else the first letter of its name in capitals; its
  `picture` size is the 64 px square of a project's page.
- `ProjectHeader` is a project page's head: `BackRow` with Quick chat at its
  end, then the picture beside the name and purpose.
- `QuickChat` is Quick chat's composer: the library `Dialog` and `Composer`
  on every size, as no frame draws it.
- `OverviewPanels` is the Overview's Inbox and Queue panels: `PageHeader`
  at its pane size over a `Panel` of `GroupHeader` groups ("Needs you" and
  "In progress" open, "To review" closed), with compact `ListRow` rows and
  a `StatusPill` for each PR. Two columns of one height on the desktop,
  one on a tablet or phone. Each Inbox row's `KindTile` takes its kind's
  word (`words.kinds`) as its `title`, so assistive tech names the kind.
  `ProjectDetail` passes the block as the Overview tab's `content`, so the
  tab's `aria-controls` panel holds it.
- Each card carries `data-figma="project card · <name>"`, which the live
  tests read for the order.
