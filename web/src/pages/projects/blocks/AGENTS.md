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
  `picture` size is the 64 px square of a project's page. Its
  `projectIcons` map satisfies the contract's `ProjectIconName`, so the
  two lists cannot drift.
- `NewProjectForm` is New project's form: the library `Dialog` on the
  desktop, else `BackRow` (Projects, Create project) over the fields.
  `NewProjectFields` holds Name with its folder line (an error when the
  folder is not free), the tile with Choose picture and its icon grid,
  and Description.
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
- `IdeasList` is the Ideas tab: a list of compact `ListRow` rows (kind,
  state and tags in the meta, the age at the end). It takes only the
  words it draws. The frames' table (D08, T08, T08b, M08) is a later
  issue's.
- `RepositoriesList` is the Repositories tab: compact `ListRow` rows (role,
  visibility and release in the meta, the counts at the end, or after the
  meta on the phone, each part not read named). The frames' sections and
  tiles are later PRs'.
- `ContextDrift` is the Context drift panel (R9): `PageHeader` with the
  secondary Run check and its `RefreshIcon` (off while `busy`) over a
  `Panel` with the check's time and scope and a compact `ListRow` for each
  finding; `OverviewPanels` draws it under Inbox and Queue, across both
  columns on the desktop.
- `ChatsPanel` is the Overview's Chats panel (R7): a `SearchField` (title
  or workspace) and `FilterChips` of the chats' area tags over compact
  `ListRow` rows (title, workspace and tags, a `StatusPill` toned as the
  Workspaces sidebar does) in a `Panel`, with the library `Pager` (10, 25
  or 50 rows; no picker on the phone). It keeps the search, chips and page
  in `useState`; a press calls `onChatOpen`. A read that missed shows its
  line and no count. It spans both desktop columns.
- Each card carries `data-figma="project card · <name>"`, which the live
  tests read for the order.
