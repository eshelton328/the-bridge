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
- `screens/ArtifactsLibrary.tsx`: the library: `LibraryHeader`, the
  source chips (`FilterChips size="compact"`, one choice), `LibraryTools`
  and a `CardGroup` per group, 12 apart, 32 in from the rail (D1).
  `screens/LibraryList.tsx`: the library beside an open artifact (D2):
  the header with an icon-only Add a link, the chips, `LibraryTools`
  without the view switch and a `RowGroup` per group.
  `screens/ArtifactDetail.tsx`: the open artifact in a `Container
  size="detail"`: `ArtifactBar`, `ArtifactTitleBlock`, `ArtifactPreview`
  and `MadeIn`, 20 apart.
  `screens/libraryView.ts` (pure, tested in `libraryView.test.ts` beside
  this file) keeps each group's cards that pass the chip and the search
  and leaves out a group with none; the chip and group counts stay the
  state's, because the library holds more artifacts than the cards drawn.
- `blocks/`: `LibraryHeader` (`PageHeader` with the count, `FoundStatus`
  and Add a link), `FoundStatus` (the refresh mark and when the library
  last checked its sources), `LibraryTools` (search, Sort, Filter and the
  Grid or List `ViewSwitch`; with `data.filterMenu` Filter opens the
  Filter menu, D3; the Sort menu comes with D6), `CardGroup` (a `GroupHeader` with the New dot and a `Grid` of four
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
  per box, as the Inbox's Filter menu). Show closes the menu; the cards
  carry no finder or update data yet, so the grid does not narrow.
- `states/`: D1 `library`, D2 `artifactOpen` (D1's data with the
  open artifact) and D3 `filterOpen` (D1's data with the Filter menu,
  two boxes checked). `library` stays first in `states/index.ts`: the app
  shows the first state without `?state=`. `library` also holds what later states share: the
  found and earlier cards (`foundCards`, `earlierCards`; export them when
  a second state uses them, as knip allows no unused export), the chips
  and the sorts. A state that opens a menu, searches or opens an
  artifact starts from it and sets its `ui` or adds its data.
- `types.ts`: `ArtifactsData` (title, count, the found status, the chips,
  the search placeholder, the sorts and the groups of `ArtifactCard`s,
  each with its `preview` kind and `source`, and the optional `open`
  `ArtifactDetail` and `filterMenu`) and `ArtifactsUi` (chip,
  sort, view, open groups, search text, and the optional open Filter
  menu and its checked boxes), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Artifacts frames need that the component
  library cannot draw yet, for the batched library PR.

`/artifacts?state=library` shows a state in development; an unknown state
is a not-found page.
