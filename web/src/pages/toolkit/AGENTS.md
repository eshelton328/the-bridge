# Toolkit page

The Toolkit: every agent, skill, workflow, rule and hook in toolkit/,
read-only. Figma frames `D*` (desktop), `T*` (tablet) and `M*` (phone)
on the Toolkit page. Read [../AGENTS.md](../AGENTS.md) first: it says
what each file of a page folder is for.

- `ToolkitPage.tsx`: reads the loader's state and keeps what Erik changes
  in its `ui` (the view, the kind chip, the search, the groups he closed)
  until another state loads; it passes them to `ToolkitScreen` with
  `onUiChange` and the rail's navigation.
- `screens/ToolkitScreen.tsx`: the app shell, laid out by its width
  (`ViewportFrame`): on the desktop the rail (`AppRail`) and the list; on
  a tablet or phone the list over the tab bar (`AppTabBar`, Toolkit opens
  from More; on the phone More opens the shared `MoreDrawer`, kept
  open by `ui.moreOpen`, M4). Without `onUiChange` it keeps the changes itself, so a story
  or canvas board can use the chips, the search and the groups.
  `screens/listView.ts` (pure, tested in `listView.test.ts` beside this
  file) narrows the groups by the kind chip and the search.
- `blocks/`: `ToolkitHeader` (title, count, source, Read-only, the List,
  Map and Activity switch), `ToolkitListTools` (search, Sort, the counts
  legend), `ToolkitGroup` (a kind's header and card grid),
  `ToolkitCard` (one item: a card on the desktop, a row with no
  description on a tablet), `ToolkitRow` (one item as a list row on
  the phone, M1) and `ToolkitMap` (the Map view, D2: the library
  `MapGraph`, each item placed by its column and row, with the legend and
  the selected item's card). `ToolkitListPane` is the list beside an
  open item (D3): `ToolkitHeader`, `ToolkitListTools` and `ToolkitGroup`
  take `layout="pane"`, and `ToolkitRow` takes `size="pane"`.
  `ToolkitItem` is the open item. On the map the list tools show no Sort and
  their own legend. On the phone the header shows the views as icon
  buttons, and Read-only moves under the search. Props only.
- `types.ts`: the view models: items, groups, kind chips, the map, an open item's details, and the `ui`.
- `states/`: one file per Figma state, each with a story in
  `screens/ToolkitScreen.stories.tsx`. A new list frame adds its frame to
  the state it shows, or a state of its own when its data differs
  (`toolkitListTablet`, T1 and M1, adds the Rules group; `moreDrawer`,
  M4, opens the More drawer over M1's list). The map (D2, `toolkitMap`)
  sets `ui.view` to `map` and `ui.mapSelected`, and adds `data.map`: the
  columns, each item's column and row, and the links. The tablet map
  (T2, `toolkitMapTablet`) has D2's items with its own first heading and
  no meta text; `ToolkitMap` draws it with smaller nodes, no legend and no
  description, and the screen leaves out the search row. The phone map
  (M11) is the same state: the screen shows the header and the map, with
  no chips and no search; `ToolkitMap` draws the tablet's map in a window
  that scrolls sideways, the hint at its foot and the selected item's card
  under the window. An open item (D3, `skillOpen`) sets `ui.open` to the
  item's path (and `ui.itemTab` for a tab other than the first) and adds
  `data.details`: for each item, its path badge, when it changed, its
  tabs, the blocks of its main file, what uses it, its files and its
  evals. `screens/itemView.ts` (pure, tested in `itemView.test.ts`) finds
  the open item; an item with no details opens with what the list
  knows. On the desktop the list moves into the list pane
  (`ToolkitListPane`) and `ToolkitItem` fills the rest, with its
  Overview (`ToolkitItemOverview`, `ToolkitFilePreview`,
  `ToolkitItemSide`); on a tablet or phone the item fills the screen
  under a back row. In the list pane the header, chips and search stay
  at the top while the groups scroll, and when the open row is out of
  view the pane scrolls its group to the top. A rule (D4, `ruleOpen`,
  which adds the Workflows and Hooks groups) adds `loads` to its details,
  shown as the Overview's load box, and has no side column: `usedIn` and
  `files` are optional. A click on a card, a row or the map card's Open
  opens an item through `onUiChange`; Show on map opens the map with the
  item selected; the path badge's copy button calls `onCopyPath`, which
  `ToolkitPage` writes to the clipboard. Later frames of the open item
  (D7 to D9, T3, T7, T17 to T19, M2, M19 to M22) fill `details` and
  the other tabs.
- [LIBRARY_GAPS.md](LIBRARY_GAPS.md): what the library cannot draw yet.
