# Artifacts page

The Artifacts library: every Claude artifact and Codex site in one grid,
with what the library found since Erik last looked at the top, marked
New. Figma frames `D*` (desktop), `T*` (tablet) and `M*` (phone) on the
Artifacts page. Read [../AGENTS.md](../AGENTS.md) first: it says what
each file of a page folder is for.

- `ArtifactsPage.tsx`: reads the loader's state and keeps what Erik
  changes in the shown `?state=` (the source chip, the search, the view
  and the open groups) with `useState`; it passes them to
  `ArtifactsScreen` with `onUiChange`. Rail picks go to the pages that
  have a route. A later frame that needs the changes to outlive a visit
  moves them to an `artifactsStore.ts` (`createAppStore`).
- `screens/ArtifactsScreen.tsx`: the app shell, laid out by its width
  (`ViewportFrame`): on the desktop the rail (`AppRail`, Artifacts
  selected) and the library in the shell's `detail`, which scrolls; on a
  tablet or phone the library over the tab bar (`AppTabBar`; the phone
  selects More, which opens Artifacts, d-105). Do not change `AppRail` or
  `AppTabBar` from this page; a difference goes in `deviations.md`.
  With an artifact open (`data.open`, D2) the desktop puts the library
  as a list in the shell's `list` (`LibraryList`) and the artifact in
  `detail` (`ArtifactDetail`); a tablet or phone frame of it comes later.
  With its discussion open (`ui.discussOpen`, D7) the list closes, the
  artifact keeps its 828 px column and `DiscussionPanel` takes the rest,
  as the Inbox's task and discussion (D14); Discuss toggles it.
- `screens/ArtifactsLibrary.tsx`: the library: `LibraryHeader`, the
  source chips (`FilterChips size="compact"`, one choice), `LibraryTools`
  and a `CardGroup` per group, 12 apart, 32 in from the rail (D1). In
  the List view (D4) `screens/LibraryRows.tsx` draws the rows instead:
  with a search, one `ListGroup` of the matches ("3 matches for “eval”"),
  each `LibraryRow` with where it matched, and the search's hint under it;
  without one, a `ListGroup` per group. During a search the header's count
  says how many show, such as "3 of 24". With `data.addLinkForm` (D5)
  Add a link opens `AddLinkDialog`.
  `screens/LibraryList.tsx`: the library beside an open artifact (D2):
  the header with an icon-only Add a link, the chips, `LibraryTools`
  without the view switch and a `RowGroup` per group.
  `screens/ArtifactDetail.tsx`: the open artifact in a `Container
  size="detail"`: `ArtifactBar`, `ArtifactTitleBlock`, `ArtifactPreview`
  and `MadeIn`, 20 apart, and an optional `side` beside it (D7).
  `screens/libraryView.ts` (pure, tested in `libraryView.test.ts` beside
  this file) keeps each group's cards that pass the chip and the search
  (title, description, link and project) and leaves out a group with none;
  `sortCards` orders each group's cards by the sort (D6: newest keeps
  the state's order, oldest turns it round, title A to Z, project grouped
  by project); the groups keep their order, so Found stays first.
  `searchMatches` lists the matches with the first place each matches, in
  that order; the chip and group counts stay the
  state's, because the library holds more artifacts than the cards drawn.
- `blocks/`: `LibraryHeader` (`PageHeader` with the count, `FoundStatus`
  and Add a link), `FoundStatus` (the refresh mark and when the library
  last checked its sources), `LibraryTools` (search, Sort, Filter and the
  Grid or List `ViewSwitch`; with `data.filterMenu` Filter opens the
  Filter menu, D3; with `data.sortMenu` Sort opens the Sort menu, D6), `CardGroup` (a `GroupHeader` with the New dot and a `Grid` of four
  columns on the desktop) and `LibraryCard` (`Card` with a `Thumbnail`,
  New as `Badge tone="working"`, and a `MetaLine` with the `KindMark`,
  source, project and age; `onOpen` makes it a button). For D2:
  `RowGroup` and `ArtifactRow` (`ListRow` with a compact `Thumbnail`,
  the kind mark and project, the New dot and the age; the open
  artifact's row is selected), `ArtifactBar` (New, who found it, Discuss,
  Copy link, Remove), `ArtifactTitleBlock` (title, description and the
  source, project and updated `MetaChip`s), `ArtifactPreview` (a banner
  `Thumbnail` over the link and Open artifact) and `MadeIn` (the chat
  that published it and Open in workspace). For D3: `FilterPopover`
  (Filter, pressed while open and with a dot while boxes are checked, and
  the `Popover` with the footer's note and Show) and `FilterMenu` (a
  `PopoverSection` per section, a `Checkbox size="compact"` with its count
  per box, as the Inbox's Filter menu). For D4: `ListGroup` (a
  `GroupHeader` over rows 6 apart), `LibraryRow` (`ListRow` in a bordered
  box: a wide `Thumbnail`, the title and the description with the match
  marked by `Highlight`, the meta line with the link when the match is in
  it, and at the end the New dot, the place as `Badge variant="tag"`, the
  age and an icon-only Open) and `NewDot` (the list rows' New dot, also in
  `ArtifactRow`). For D5: `AddLinkDialog` (`Dialog size="lg"` with the
  link and title `TextField`s, the source as a `ViewSwitch` of the two
  kinds, `ProjectPicker` and Cancel and Add artifact; the link field has
  the focus, the caret after the link) and `ProjectPicker` (a
  `RadioMenu` on a `Button`, as the library has no select field). Show closes the menu; the cards
  carry no finder or update data yet, so the grid does not narrow. For
  D6: `SortMenu` (Sort, pressed while open, on a `RadioMenu
  width="sort"` with the heading, a description per sort and the note,
  as the Inbox's Sort menu; picking a sort closes it). For D7:
  `DiscussionPanel` (the header with Open in workspace and Close,
  `ModelChip`, `ContextMeter`, the guard, the empty state or the sent
  messages, and `Composer`, whose draft is `ui.discussDraft`) and
  `DiscussionEmpty` (the icon tile, "It can" and the suggestions, which
  fill the reply box). They are built from the same library parts as the
  Inbox's discussion blocks, which the Inbox page does not export.
  For D8: `DiscussionEntry` (Erik's message, the discussion's reply with
  its bubble and name, or a proposal) and `ArtifactProposal`
  (`ProposalBlock tone="update"` with its `ProposalDiff`, Apply, Discard
  and Edit first, as the Inbox's proposed update). `screens/discussionView.ts`
  (pure, tested in `discussionView.test.ts`) drops a discarded proposal,
  puts the sent messages after the entries, and says what each button
  does: Discard sets `ui.discussProposal` to `discarded`, Apply to
  `applied` (the applied artifact is D9's state, built later), and Edit
  first puts the lines the proposal adds in the reply box.
- `states/`: D1 `library`, D2 `artifactOpen` (D1's data with the
  open artifact), D3 `filterOpen` (D1's data with the Filter menu,
  two boxes checked), D4 `searchList` (D1's data in the List view with
  "eval" searched: the chips count the matches, and Earlier gains the
  Writer cross-family round, whose link holds its match) and D5 `addLink`
  (D1's data with the Add a link dialog open, Codex site picked) and D6
  `sortOpen` (D1's data with the four sorts and the Sort menu open) and
  D7 `discussOpen` (D2's data with its discussion open; `artifactOpen`
  holds the discussion, so D2's Discuss opens it) and D8 `changeProposed`
  (D7's data with a question, the reply and a proposed update to the
  chart; the discussion's `layers` hold each frame's node ids of its two
  Open in workspace buttons). `library` stays first in `states/index.ts`: the app
  shows the first state without `?state=`. `library` also holds what later states share: the
  found and earlier cards (`foundCards`, `earlierCards`; export them when
  a second state uses them, as knip allows no unused export), the chips
  and the sorts. A state that opens a menu, searches or opens an
  artifact starts from it and sets its `ui` or adds its data.
- `types.ts`: `ArtifactsData` (title, count, the found status, the chips,
  the search placeholder, the sorts and the groups of `ArtifactCard`s,
  each with its `preview` kind and `source`, and the optional `open`
  `ArtifactDetail`, `filterMenu`, `addLinkForm`, `sortMenu` and the
  open artifact's `discussion`) and `ArtifactsUi` (chip,
  sort, view, open groups, search text, and the optional open Filter
  menu and its checked boxes, whether the matches group is open, and the
  open Add a link dialog and its picked source, the open Sort menu, and
  the open discussion, its draft, the sent messages and what Erik did to
  its proposal), each
  a Zod schema. A card may have a `link`, and `search` holds the label of
  each match place and the hint (D4).
- `LIBRARY_GAPS.md`: what the Artifacts frames need that the component
  library cannot draw yet, for the batched library PR.

`/artifacts?state=library` shows a state in development; an unknown state
is a not-found page.
