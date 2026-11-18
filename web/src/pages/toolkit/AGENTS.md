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
  a tablet or phone the list, with the tab bar (`AppTabBar`) laid over
  its foot (AppShell `tabBarOverlay`: the page runs under the bar, as
  Figma's M2, M20 and M22 do, and its end scrolls clear of it; Toolkit opens
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
  `ToolkitItem` is the open item, with its path row (`ToolkitItemPath`)
  and Discuss and Show on map (`ToolkitItemActions`). On the map the list tools show no Sort and
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
  `ToolkitItemSide`); on a tablet or phone (T3, `skillOpenTablet`, D3's
  data) the item replaces the list in the shared `DetailFrame` (d-107):
  the back row (Back to Toolkit, Discuss and Show on map) stays at the
  top, the item scrolls under it, and the Overview puts the side under
  the file (`src/app/ToolkitStickyBack.test.tsx`). On the phone (M2,
  `skillOpenPhone`, D3's data) Discuss and Show on map are icon buttons,
  and when the item changed (`ToolkitItemChanged`) moves from the path
  row to the kind badge's row. An item opened from another item's links
  (T7, `agentOpenTablet`, D7's data) records it in `ui.from`, and on a
  tablet or phone the back row (`ToolkitItemBack`) shows the breadcrumb
  Toolkit › that item › the open item, whose middle crumb goes back to it
  (`openFrom`, `backTo` and `openedFrom` in `screens/itemView.ts`). A rule (D4, `ruleOpen`,
  which adds the Workflows and Hooks groups) adds `loads` to its details,
  shown as the Overview's load box, and has no side column: `usedIn` and
  `files` are optional. On a tablet (T17, `ruleOpenTablet`, D4's data) the rule
  opens in `DetailFrame` as T3's skill does, and its load box spans the
  item. On the phone (M19, `ruleOpenPhone`, D4's data) the rule opens as
  M2's skill does; the load box spans the item, its condition wraps beside
  the label, and the overview's rows are 8 apart, so the file's last line
  stays above the tab bar. An agent (D7, `agentOpen`, T1's list with only
  the Skills and Agents groups and Skills closed) adds `runs` to its
  details, the How it runs cards (`ToolkitAgentRuns`) between the
  description and the columns, a `meta` after the preview's file name and
  a file line's `meta` (its length). On the phone (M20, `agentOpenPhone`,
  D7's data) the How it runs cards sit two across (`ToolkitAgentRuns`
  `columns="2"`). A hook (D9, `hookOpen`, D4's list
  with only the Rules, Workflows and Hooks groups) uses `runs` for its
  When it runs cards (the git event, its state as a badge through a
  fact's `status`, the rule it enforces, its test; captions in small
  text), shows its script as code (`preview.code`, drawn with the
  library's `CodeLines`) and lists its files with the code icon (a file
  line's `type: 'code'`). On a tablet (T19, `hookOpenTablet`, D9's data)
  the hook opens in `DetailFrame` as T17's rule does: its rows are 12
  apart, the When it runs cards take `Panel`'s notice variant so their
  text keeps Figma's lines, and the files sit 24 under the code. On the phone (M22, `hookOpenPhone`, D9's
  data) the hook opens as M19's rule does: the When it runs cards sit two by
  two (`ToolkitAgentRuns` `columns="2"`, with T19's notice variant), the
  overview's rows are 8 apart, the script's long lines wrap (`CodeLines`
  `wrap`, `ToolkitFilePreview` `wrapCode`) and the script runs under the
  tab bar, as in Figma. A workflow (D8, `workflowOpen`, D9's list)
  adds `flow` to its details: its steps by phase
  (`ToolkitWorkflowFlow`, each card a `ToolkitFlowStep`), drawn in a grid
  whose card rows are equal, so every card has one size; a phase's
  `from` rows take an arrow from the phase before, a `parallel` phase
  has no arrow between its steps, gates and ends are amber, and the
  loop's label sits under the lanes (each arrow is the library's
  `FlowLine`; it has no elbow for these rows and no loop into a step's
  foot: LIBRARY_GAPS.md, Workflow flow by phase). Open full page sets
  `ui.flowFullPage` and opens How it works (`openFullPage` in
  `screens/flowView.ts`; D8, T18 and M21 carry the workflow's page, and
  the button is disabled on an item with no `flowPage`), and the agent buttons under the flow open the
  agent. A workflow with a `flowPage` then fills the page without the
  list (D13, `workflowFullPage`, D8's data with `flowPage` and step 4 in
  `ui.flowStep`): the breadcrumb row Toolkit › Workflows › the workflow
  with Discuss and Show on map tops it on the desktop too
  (`ToolkitItemBack` with D13's `layers` and `tall`; Workflows goes back
  to the list narrowed to workflows), and How it works is
  `ToolkitFlowPage`: the description, the flow (`ToolkitFlowSteps`: the
  stages left to right, each a column of four equal rows, a parallel
  stage's two steps at the top and the bottom and a single step across
  the middle, `blocks/flowLayout.ts`; each card a
  `ToolkitFlowStep variant="page"` whose title selects the step; the
  library's `FlowLine` and `FlowBranch` between stages, the gate's way
  out to the stop, and the `FlowLoop` back to it, placed by CSS anchors,
  with its label under the step it names) and `ToolkitFlowDetails` (the selected step's fields, the gates,
  the rounds). On a tablet or phone the stages stand in one column with
  the parallel steps side by side, and the panels one under another
  (`src/app/ToolkitWorkflowPage.test.tsx`). On a tablet (T8,
  `workflowFullPageTablet`, D13's data with the tablet's shorter lines, five
  fields for step 4 and no stop box, loop label, hint, gates or rounds) the
  breadcrumb row is the `DetailFrame`'s back row (36 high, D13's `layers`),
  and the flow is `ToolkitFlowColumn`: no panel or header, each card a
  `ToolkitFlowStep variant="column"` as wide as the item, a `FlowLine`
  down between stages and a `FlowBranch` fork into and join out of the
  parallel steps (`columnArrow` in `blocks/flowLayout.ts`; two parallel
  stages in a row get a `FlowLine` from each step, on every layout,
  `ToolkitFlowSteps.test.tsx`); the selected step's panel comes
  under it. On the phone (M9, `workflowFullPagePhone`, T8's data) the
  breadcrumb leaves out the kind's crumb (Toolkit › the workflow), Discuss
  and Show on map are icon buttons, when it runs sits beside the kind
  badge, the path row is left out and the rows are 10 apart under the
  smaller title, as on M12; the column's fork and join are 24 high and the
  page ends with the steps, with no details panel under them until a step
  is tapped; then that step's panel (`ToolkitFlowDetails panels="step"`)
  comes under them.
  `flowView.test.ts` checks the pure parts (LIBRARY_GAPS.md, Workflow
  page flow, description and details). On a tablet (T18, `workflowOpenTablet`, D8's
  data) the flow is drawn smaller (`ToolkitWorkflowFlow size="sm"`:
  narrower lanes, smaller cards and text; LIBRARY_GAPS.md, Workflow flow
  (tablet)). On the phone (M21, `workflowOpenPhone`, D8's data) the flow is
  not drawn (`ToolkitWorkflowFlow steps={false}`): the steps' header and the
  agents' row are one line each, cut at the item's edge and scrolled
  sideways, and the flow's `elsewhere` line says the steps are on How it
  works. A click on a card, a row or the map card's Open
  opens an item through `onUiChange`; Show on map opens the map with the
  item selected; the path badge's copy button calls `onCopyPath`, which
  `ToolkitPage` writes to the clipboard. The How it works tab (D14,
  `skillHowItWorks`, D3's data with `ui.itemTab` `how`) draws a detail's
  `how`: the header with the file the steps come from and the legend, when
  the item loads, the steps four to a row (`ToolkitHowItWorks`, each card a
  `ToolkitHowStep` with its uses and the step's repeat), the library's
  `ChatPath` for a shorter path and the source line. It takes any list of
  steps, so a rule, an agent or a hook (D37 to D39) can fill it. A rule
  (D37, `ruleHowItWorks`, D4's data with D9's groups) names its sources in
  the label (no `file`), has four steps in one row and, in the chat path's
  place, `elsewhere`: one line on what Codex does instead, in a notice
  `Panel`. An agent (D38, `agentHowItWorks`, D7's data) names its prompt
  file in the label, so it shows in capitals, and uses `elsewhere` for the
  only inputs it gets. A hook (D39, `hookHowItWorks`, D9's data) names its
  script's comments in the label, has five steps (the fifth starts a second
  row) and uses `elsewhere` for its tests. On a tablet (T10,
  `skillHowItWorksTablet`, D14's data with the tablet's shorter trigger and
  step lines) the tab is `ToolkitHowColumn`: no box, header, legend or
  source line; the trigger spans the item, the steps stand in one column
  (`ToolkitHowStep compact`: the number beside the text, the uses side by
  side) and the chat path follows. Its `how` sets `named`: the back row
  names the item (Toolkit › writer, `ToolkitItemBack named`), and the kind
  badge and path rows are left out. A rule on a tablet (T36,
  `ruleHowItWorksTablet`, D37's data with no `elsewhere`) does not set
  `named`, so the item keeps T17's header (Toolkit, the kind badge, the
  name and the path row) and the column starts where the tabs' panel puts
  it. An agent on a tablet (T37, `agentHowItWorksTablet`, D38's data with
  no `elsewhere` and `ui.from` set to writer, as on T7) keeps the same
  header under the breadcrumb Toolkit › writer › writing-reviewer. A hook
  on a tablet (T38, `hookHowItWorksTablet`, D39's data with no
  `elsewhere`, step 3's use shown as a file) keeps T19's header over the
  five steps. Under
  the full header the steps start 14 under the trigger, where T10's start
  12 under it. On the phone (M12, `skillHowItWorksPhone`, T10's data) the tab
  is the same column (`ToolkitHowColumn layout="phone"`), with the title in
  the smaller title style and the rows 10 apart. A rule on the phone (M39,
  `ruleHowItWorksPhone`, T36's data) keeps M19's header over the same column,
  whose rows are then 12 apart, as the header's are. An agent on the phone
  (M40, `agentHowItWorksPhone`, T37's data with no `ui.from`, as on M20)
  keeps M20's header, with no breadcrumb, over the same column. A hook on the phone (M41,
  `hookHowItWorksPhone`, T38's data) keeps M22's header over the same column
  and its five steps. The Files tab (D6, `skillFiles`, D3's data with
  `ui.itemTab` `files`) draws a detail's `browser` (`ToolkitFileBrowser`): the
  item's folders and files in the library's `FileTree` (each node's count and
  role line; the folders in `expanded` open at first) beside the selected file
  in `ToolkitFileViewer` (the bar with the path, its meta, copy and Read-only;
  the code in `CodeLines` or the blocks in `ToolkitMarkdownBlocks`, which the
  Overview's preview shares; the line on what uses the file). `ui.file` picks
  the file, else the browser's `selected` (`openFile` in `blocks/filesView.ts`,
  tested in `filesView.test.ts`); a file the state has no view of shows its bar
  only. On the desktop the tree and the viewer sit side by side and the box
  runs to the pane's foot (`src/app/ToolkitFiles.test.tsx`); on a narrower
  layout the viewer comes under the tree. A script whose view has `explain`
  (D10, `scriptExplained`, D6's data with check's explanation) opens on
  Explain: the bar holds the Explain and Code switch (`ViewSwitch`), and the
  viewer draws the library's `ScriptExplanation` (the overview with its facts,
  the steps with their line links, the note); a line link or Code shows the
  source. `ui.fileView` keeps the choice, and another file opens on its own
  default (`fileMode` in `blocks/filesView.ts`). The other kinds fill the same
  browser with their own files: a rule (D33, `ruleFiles`, D37's list) is one
  file, a one-row tree with its role line, its first lines as code and when it
  loads; an agent (D34, `agentFiles`, D7's list) is one file too, its prompt,
  with its model and tools in the frontmatter; a workflow (D35, `workflowFiles`,
  D8's list) is one design doc, with the harness/ folder of the scripts its
  steps run, which are outside the toolkit; a hook (D36, `hookFiles`, D9's list)
  is the script and its tests, two script rows with the tests selected. On a
  tablet (T4, `skillFilesTablet`, D6's files with references/ alone open, doc.md
  first and selected, and each file's count in lines) the Files tab has no kind
  badge: the title and the path row, which names the item's folder and its files
  (the browser's `badge`), sit 8 apart, 16 under the back row and over the tabs
  (`filesPage`; T3's 20 is for the kind badge), and the tree and the viewer
  are two boxes, the viewer under the tree with no copy button in its bar. A
  browser with no `badge` keeps the item's header on a tablet, as on T17: a
  rule (T32, `ruleFilesTablet`, D33's list) shows its kind badge, name and path
  row over the tabs, its one file's role line ending with its length, and the
  rule rendered under the tree; an agent (T33, `agentFilesTablet`, D34's list,
  opened from writer as on T7) does the same under T7's breadcrumb, and a
  workflow (T34, `workflowFilesTablet`, D35's list) with the harness/ folder
  open and each script's count in lines; a hook (T35, `hookFilesTablet`,
  D36's list) sums up its tests in the viewer: a view with `summary` draws its
  blocks rendered with no Rendered and Source switch (`fileMode`), since a
  script's summary has no Markdown source. A
  Markdown file (a view with blocks and no code) opens rendered
  (`ToolkitFileBody`), with the Rendered and Source switch under its text; Source
  shows the source written back from the blocks (`markdownSource`), and
  `ui.fileView` keeps the choice (`rendered` or `code`). On a tablet or phone a
  script with an explanation opens on a page of its own (T6,
  `scriptExplainedTablet`, D10's data with the script's language and length and
  no line on what uses it, `ui.filePage`; `selectFile` in `blocks/filesView.ts`
  sets it): the back row goes back to Files, the title and the path badge name
  the script (the badge's folder and the file's path), and `ToolkitFilePage`
  puts the Explain and Code switch in a row over the box. Back to Files shows
  the tree with the script under it, still selected; a tap on its row opens its
  page again (`opensPage`; the library's FileTree reports no tap on the
  selected row, so `ToolkitFileBrowser` handles it). On the phone (M5,
  `skillFilesPhone`, T4's files with the phone's shorter role lines and only
  scripts/ open) the Files tab has no viewer: the item's folder in the toolkit
  (`ToolkitFileBrowser` `folder`) sits over the tree, the tree marks only the
  file opened last (`ui.file`, `marked`), and every file with a view opens on
  its page (`selectFile`'s `phone`). A browser with a `badge` leaves out the
  path row too, and the copy button joins the back row's icon buttons
  (`ToolkitItemActions` `copy`). A file on its page on the phone (M6,
  `scriptCodePhone`, M5's files with the phone's source of check, as Figma
  numbers its lines, and D10's explanation, on Code) has no title: the path
  badge names the file with its icon and no copy button, and the copy button
  joins the back row. `ToolkitFilePage layout="phone"` puts the file's meta
  line over the switch, and on Code the line on what runs it after
  Read-only, the source wrapped (`CodeLines` `wrap`) in a box and the view's
  `footnote` under it. On Explain (M8, `scriptExplainedPhone`, M6's data)
  the explanation has no box: `ToolkitFilePage` restyles the library's
  `ScriptExplanation` slots so it starts at the item's edge and each line
  link sits under its step's text (LIBRARY_GAPS.md, Script explanation).
  A browser with no `badge` keeps the item's header on the phone, as on M19
  (M35, `ruleFilesPhone`, T32's files with the phone's role line: the
  length and kind), with the folder and the tree under the tabs and no row
  marked until a file is opened. An agent on the phone (M36,
  `agentFilesPhone`, T33's files with no `ui.from`, as on M20) does the
  same under Back to Toolkit, and a workflow (M37, `workflowFilesPhone`,
  T34's files) shows its doc and the harness/ folder open; a hook (M38,
  `hookFilesPhone`, T35's files) its script and its tests. The Links tab
  (D19, `skillLinks`, D3's data with `ui.itemTab` `links`) draws a detail's
  `links` (`ToolkitLinks`): a line on what it shows, the count of links and
  the hint, the graph (`ToolkitLinksGraph`: the library's `MapGraph` with
  the item selected in the middle, the items that name it on the left and
  the items it names on the right, each column in the side's `graph`
  order, placed by `linksGraph` in `blocks/linksView.ts`, tested in
  `linksView.test.ts`), the two panels side by side (`ToolkitLinksPanel`:
  each link's item as a `MapNode`, its file and line, and the line's text)
  and the note. A tap on an item opens it from the open item (`openFrom`);
  a tap on a file and line opens that file on its item's Files tab
  (`linkFile`, and `openFile` in `screens/itemView.ts`;
  `src/app/ToolkitLinks.test.tsx`). Only the
  selected tab's panel is drawn. Later frames of the open item fill the
  other tabs.
- [LIBRARY_GAPS.md](LIBRARY_GAPS.md): what the library cannot draw yet.
