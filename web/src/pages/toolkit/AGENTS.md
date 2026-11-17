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
  the selected item's card). On the map the list tools show no Sort and
  their own legend. On the phone the header shows the views as icon
  buttons, and Read-only moves under the search. Props only.
- `types.ts`: the view models: items, groups, kind chips, the map, and the `ui`.
- `states/`: one file per Figma state, each with a story in
  `screens/ToolkitScreen.stories.tsx`. A new list frame adds its frame to
  the state it shows, or a state of its own when its data differs
  (`toolkitListTablet`, T1 and M1, adds the Rules group; `moreDrawer`,
  M4, opens the More drawer over M1's list). The map (D2, `toolkitMap`)
  sets `ui.view` to `map` and `ui.mapSelected`, and adds `data.map`: the
  columns, each item's column and row, and the links. An open item (D3)
  adds an item and its own screen.
- [LIBRARY_GAPS.md](LIBRARY_GAPS.md): what the library cannot draw yet.
