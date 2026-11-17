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
  from More). Without `onUiChange` it keeps the changes itself, so a story
  or canvas board can use the chips, the search and the groups.
  `screens/listView.ts` (pure, tested in `listView.test.ts` beside this
  file) narrows the groups by the kind chip and the search.
- `blocks/`: `ToolkitHeader` (title, count, source, Read-only, the List,
  Map and Activity switch), `ToolkitListTools` (search, Sort, the counts
  legend), `ToolkitGroup` (a kind's header and card grid) and
  `ToolkitCard` (one item). Props only.
- `types.ts`: the view models: items, groups, kind chips, and the `ui`.
- `states/`: one file per Figma state, each with a story in
  `screens/ToolkitScreen.stories.tsx`. A new list frame (T1, M1) adds its
  frame to the state it shows; the map (D2) and an open item (D3) add a
  `ui.view` or an item and their own screens.
- [LIBRARY_GAPS.md](LIBRARY_GAPS.md): what the library cannot draw yet.
