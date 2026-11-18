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
  tablet or phone the library with the tab bar (`AppTabBar`) laid over
  its foot (AppShell `tabBarOverlay`), so the library runs under the bar
  and its end scrolls clear of it (the phone
  selects More, which opens Artifacts, d-105). Do not change `AppRail` or
  `AppTabBar` from this page; a difference goes in `deviations.md`.
  With an artifact open (`data.open`, D2) the desktop puts the library
  as a list in the shell's `list` (`LibraryList`) and the artifact in
  `detail` (`ArtifactDetail`). On a tablet (T2) it opens as its own page,
  `screens/ArtifactPage.tsx`, which runs under the tab bar as the library
  does, its end scrolled clear of the bar (`ArtifactsStickyBars.test.tsx`):
  the shared `DetailFrame`
  with `ArtifactTopBar` (Back, Discuss, and Copy link and Remove as icons)
  in its header, so the Back bar stays at the top and only the page under
  it scrolls (d-107), then `ArtifactTitleBlock` with `ArtifactStatus`
  (New and who found it) over the title, a framed `Thumbnail
  shape="wide"`, Open artifact the full width, the link and `MadeIn`,
  20 apart. Back sets `ui.artifactClosed` and the library shows (T1).
  Discuss sets `ui.discussOpen`, and on a tablet the discussion opens as
  its own page, `screens/ArtifactDiscussionPage.tsx`, with no tab bar
  (T4), as the Inbox's (Inbox T17): the shared `DetailFrame` with the nav
  (Back, `ModelContext` in the middle and Open in workspace) and
  `DiscussedArtifactCard` in its header, the empty state or the entries
  under them, and the reply box as its sticky footer, whose long draft
  the Composer caps at 30% of the page, so the nav and the card
  stay at the top and the reply box at the bottom while only the messages
  scroll (d-107). Back and the card return to the artifact (T2). With
  entries (T5) the page shows D8's question, reply and proposal; there
  Apply also closes the page (`proposalEffect(…, 'page')`), so the
  artifact's page shows Updated, as D9 does on the desktop, and Discuss
  reopens the discussion with the applied proposal. On a phone (M2) the
  artifact opens on the same page (`ArtifactPage layout="phone"`), under
  the tab bar with More selected: `ArtifactTopBar layout="phone"` has
  only the ⋯ button, which sets `ui.fileOpen` and opens File in a
  project as a sheet over the tab bar (M7, `FileSheet` with
  `data.fileMenu`, which `ArtifactsScreen` draws over an open artifact
  at any width when `ui.fileOpen` is set; only the phone has a button
  that opens it);
  `ArtifactTitleBlock layout="phone"` puts its rows 8 apart with the
  source and project chips only; Copy link and Discuss sit side by side
  under Open artifact in place of the link; and `MadeIn` draws the chat
  with no box and Open in workspace as a link (`madeIn.action`); the
  sections are 16 apart. Back sets `ui.artifactClosed` and M1 shows.
  Discuss sets `ui.discussOpen`; the phone's discussion page comes with
  M9, so until then the artifact's page stays.
  With its discussion open (`ui.discussOpen`, D7) the list closes, the
  artifact keeps its 828 px column and `DiscussionPanel` takes the rest,
  as the Inbox's task and discussion (D14); Discuss toggles it. The
  artifact's column (the shared block `DetailFrame`) and the discussion
  (the library `ScrollFrame`) each scroll on their own: the discussion's
  header stays at the top and its reply box, whose long draft the Composer
  caps at 30% of the panel, at the bottom, while only the messages between them scroll (d-107).
  `app/ArtifactsStickyBars.test.tsx` scrolls D7 to D9 and checks both
  bars stay in view, and that a long draft keeps Send in reach; it also
  scrolls T2's page and checks the Back bar and the tab bar stay put,
  and that Back shows the library, and scrolls T4's page and checks the
  nav, the card and the reply box stay put, that a long draft keeps Send
  in reach, and that T2's Discuss opens T4 and its card returns to T2;
  it scrolls T5's page the same way and checks that Apply returns to T2,
  Updated, and that Discuss then shows the applied proposal; and it
  scrolls M2's page and checks the Back bar and the tab bar stay put, and
  that Back shows M1's library.
- `screens/ArtifactsLibrary.tsx`: the library: `LibraryHeader`, the
  source chips (`FilterChips size="compact"`, one choice), `LibraryTools`
  and a `CardGroup` per group, 12 apart, 32 in from the rail (D1). On a
  tablet (T1) the rows are 10 apart, 20 in: `LibraryHeader` puts the found
  status on its own row under a 44 px header with the phone title size and
  a 36 px Add a link, `LibraryTools size="lg"` gives 36 px controls 8 apart
  with no space before the view switch, and `CardGroup` draws two columns
  of cards, 12 apart, whose meta line has the source mark without its name
  (the name stays as screen-reader text). There
  Filter opens the Filter menu as a sheet from the bottom over the tab
  bar (T3, `LibraryTools filterAs="sheet"`). In
  the List view (D4) `screens/LibraryRows.tsx` draws the rows instead:
  with a search, one `ListGroup` of the matches ("3 matches for “eval”"),
  each `LibraryRow` with where it matched, and the search's hint under it;
  without one, a `ListGroup` per group. During a search the header's count
  says how many show, such as "3 of 24". With `data.addLinkForm` (D5)
  Add a link opens `AddLinkDialog`.
  `screens/LibraryPhone.tsx`: the library on a phone (M1): `LibraryHeader
  layout="phone"` (a 36 px plus button for Add a link), the chips,
  `LibraryTools iconOnly` (icon-only Sort and Filter, no view switch),
  `FoundStatus` under the search row, and a `RowGroup layout="phone"` per
  group, whose `ArtifactRow`s put the age on the title line and New as a
  badge under it; the rows are 6 apart. With `data.filterMenu` the
  icon-only Filter opens T3's sheet over the tab bar (M3, `FilterSheet
  iconOnly`), and with `data.sortMenu` the icon-only Sort opens D6's
  menu as a sheet over the tab bar (M4, `LibraryTools sortAs="sheet"`).
  With a search (M5) the found status and the groups give way to one
  `RowGroup` of the matches (`search`, no count), whose `ArtifactRow`s
  mark a title match, or show the line that matched under the meta line
  with the match marked: the state's excerpt of a description
  (`data.search.excerpts`) or the link. `data.search.fieldLayer` names
  the search field's Figma layer by node id, as M5's keyboard key is
  named "search" too. The keyboard is the phone's own (d-089): the
  render draws none and keeps the tab bar, which Figma keeps under it.
  With `data.addLinkForm` the plus button opens D5's form as a sheet over
  the tab bar (M6, `AddLinkSheet`).
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
  `Thumbnail` over the link and Open artifact), `LinkMark` (the link's
  chain mark, 20 px in a 12 px place, also on T2's page) and `MadeIn` (the chat
  that published it and Open in workspace). For D3: `FilterPopover`
  (Filter, pressed while open and with a dot while boxes are checked, and
  the `Popover` with the footer's note and Show) and `FilterMenu` (a
  `PopoverSection` per section, a `Checkbox size="compact"` with its count
  per box, as the Inbox's Filter menu; with `sheet`, each section's label
  is a `GroupHeader` above its rows). For T3: `FilterSheet` (Filter, 36 px
  and pressed while open, with a dot once the sheet closes on checked
  boxes, and a `BottomSheet` titled Filter with Clear, which clears the
  boxes, the `FilterMenu` and Show the full width; Show applies the boxes
  and closes it, and the scrim and Escape close it and keep them, so both
  return to T1 with the filter; `app/ArtifactsRoute.test.tsx` checks it). For D4: `ListGroup` (a
  `GroupHeader` over rows 6 apart), `LibraryRow` (`ListRow` in a bordered
  box: a wide `Thumbnail`, the title and the description with the match
  marked by `Highlight`, the meta line with the link when the match is in
  it, and at the end the New dot, the place as `Badge variant="tag"`, the
  age and an icon-only Open) and `NewDot` (the list rows' New dot, also in
  `ArtifactRow`). For D5: `AddLinkFields` (the form's fields: the link
  and title `TextField`s, the source as a `ViewSwitch` of the two kinds
  and `ProjectPicker`, each line under a field only when the form has
  one; the link field has the focus, the caret after the link),
  `AddLinkDialog` (`Dialog size="lg"` with `AddLinkFields` and Cancel and
  Add artifact) and `ProjectPicker` (a
  `RadioMenu` on a `Button`, as the library has no select field). Show closes the menu; the cards
  carry no finder or update data yet, so the grid does not narrow. For
  D6: `SortMenu` (Sort, pressed while open, on a `RadioMenu
  width="sort"` with the heading, a description per sort and the note,
  as the Inbox's Sort menu; picking a sort closes it). For M4:
  `SortSheet` (the phone's icon-only Sort and a `BottomSheet` titled
  Sort by with an `OptionList size="sm"` of the sorts and the note under
  it, as the Inbox's phone Sort sheet; picking a sort closes it, and the
  scrim and Escape close it and keep the sort). For M6: `AddLinkSheet`
  (a `BottomSheet` titled Add a link with Cancel at the start of its
  title row and Add at the end, then the description and
  `AddLinkFields`, 16 apart; Cancel, the scrim and Escape close it). For
  M7: `FileSheet` (a `BottomSheet` titled File in a project with Done,
  the artifact's title, an `OptionList selectedFill` of Not in a project
  and the projects, each with its count and a folder, cyan on the checked
  one, then under a rule Remove from the library as a `dangerText`
  button and its note, 2 apart; picking a project sets `ui.fileProject`
  and checks it; Done, the scrim and Escape close it; Remove does
  nothing yet, as the desktop's Remove (D2)). For D7:
  `DiscussionPanel` (a `ScrollFrame` of `DiscussionHeader`, the empty
  state or the sent messages, and `Composer`, whose draft is
  `ui.discussDraft`), `DiscussionHeader` (the title with Open in
  workspace and Close, `ModelContext` and `DiscussionGuard`),
  `ModelContext` (`ModelChip`, `ContextMeter` and "context"),
  `DiscussionGuard` (the lock and what the discussion may do) and
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
  `applied`, and Edit first puts the lines the proposal adds in the reply
  box. For D9: with `applied`, `appliedView` (same file) shows the
  artifact's `applied` pill, bar line and updated chip and the proposal's
  `apply` context; `ArtifactProposal` draws its `apply` eyebrow, the lines
  it put in and its note, with no buttons, as the Inbox's applied update
  (Inbox D16). The link stays: Apply republishes to it. For T4:
  `DiscussedArtifactCard` (a `Panel variant="notice"` with the title, New
  as `StatusPill tone="working"`, a chevron whose button covers the card
  and returns to the artifact, the source, project and age, and
  `DiscussionGuard`).
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
  Open in workspace buttons; it also holds what Apply shows, so its Apply
  shows D9) and D9 `changeApplied` (D8's data after Apply) and T1
  `libraryTablet` (D1's data on the tablet: "Search artifacts", two
  shorter Earlier descriptions, and only Earlier's two cards in the frame) and T2
  `artifactTablet` (T1's data with D2's open artifact, no discussion yet)
  and T3 `filterTablet` (T1's data with the Filter sheet open and D3's two
  boxes checked; `libraryTablet` holds the sheet's menu, D3's with Clear
  and "Show 7 artifacts", so T1's Filter opens it) and T4 `discussTablet`
  (T2's data with its discussion open; `artifactTablet` holds D7's
  discussion with T4's Back label and node id, so T2's Discuss opens it)
  and T5 `changeProposedTablet` (T4's data with D8's discussion and open
  artifact, so its Apply shows T2 Updated; T5's node id of Open in
  workspace) and M1 `libraryPhone` (D1's data on the phone: "Search
  artifacts", and only Earlier's five rows in the frame) and M2
  `artifactPhone` (M1's data with D2's open artifact in the phone's
  shorter words and D7's discussion) and M3 `filterPhone` (M1's data with
  T3's sheet open and its two boxes checked; the menu's `footLayer` is
  M3's node id of the footer around Show; `libraryPhone` does not hold the
  menu, so M1's Filter opens nothing yet) and M4 `sortPhone` (M1's data
  with D6's sorts and Sort menu and the Sort sheet open, Newest first
  picked) and M5 `searchPhone` (M1's data with D4's search, "eval",
  the excerpt of the readme cold-reader run's description and the
  Writer round's preview as a chart) and M6 `addLinkPhone` (M1's data
  with D5's form in the phone's shorter words, the sheet open, Codex site
  picked) and M7 `filePhone` (M2's data with the File in a project
  menu, the sheet open, skill-evals checked). `library` stays first in `states/index.ts`: the app
  shows the first state without `?state=`. `library` also holds what later states share: the
  found and earlier cards (`foundCards`, `earlierCards`; export them when
  a second state uses them, as knip allows no unused export), the chips
  and the sorts. A state that opens a menu, searches or opens an
  artifact starts from it and sets its `ui` or adds its data.
- `types.ts`: `ArtifactsData` (title, count, the found status, the chips,
  the search placeholder, the sorts and the groups of `ArtifactCard`s,
  each with its `preview` kind and `source`, and the optional `open`
  `ArtifactDetail`, `filterMenu` (with the tablet sheet's `clear`), `addLinkForm`, `sortMenu`, the
  open artifact's `discussion` and `fileMenu`) and `ArtifactsUi` (chip,
  sort, view, open groups, search text, and the optional open Filter
  menu and its checked boxes, whether the matches group is open, and the
  open Add a link dialog and its picked source, the open Sort menu,
  whether Back closed the open artifact (T2, M2), whether the phone's ⋯
  opened File in a project (M7) and the project picked in it, and the open discussion, its draft, the sent messages and what Erik did to
  its proposal), each
  a Zod schema. A card may have a `link`, and `search` holds the label of
  each match place and the hint (D4).
- `LIBRARY_GAPS.md`: what the Artifacts frames need that the component
  library cannot draw yet, for the batched library PR.

`/artifacts?state=library` shows a state in development; an unknown state
is a not-found page.
