# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` (desktop), `T*`
(tablet) and `M*` (phone) on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=`, and from
  `inboxStore.ts` the open groups and, for the shown `?state=`, whether
  Erik closed the open item with Back (tablet or phone), the prompt or
  remove dialog, the search text he typed and the rest of what he changed
  in its `ui` (`setUi`: menus, the prompt editor, the sort, the filters,
  items snoozed, marked done or dismissed); it passes them to `InboxScreen` with the
  setters, and `onUiChange` reports the `ui` changes.
- `screens/InboxScreen.tsx`: the app shell, laid out by its width
  (`ViewportFrame`): on the desktop the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`) side by side, with the
  open task's row drawn selected (d-101); on a
  tablet or phone the list, or the open item under Back
  (`BackToInbox`), full width, with the tab bar (`AppTabBar`) laid over
  the page's foot (AppShell `tabBarOverlay`): the page runs under it
  and its end scrolls clear of it. A chat hides the tab bar. On a tablet
  or phone the item's `DetailFrame` is the shell detail's own child, so
  Start, the answer and the run card stick above the bar
  (`bottom: var(--scroll-frame-inset, 0px)`); `app/PhoneTabBar.test.tsx`
  checks it on M2, and the list's end on Toolkit M1. The `viewport` prop applies only until the width is
  measured; `InboxLayout.test.tsx` checks both layouts. `InboxListPane`
  shows the list through `screens/listView.ts` (pure, tested in
  `listView.test.ts` beside this file): the state's groups less the items snoozed, marked
  done or dismissed (those two count in Done, and go at the top of Today
  when the state shows the Done list), then the filters that apply, the search and the sort, with the
  counts that follow. The Filter menu's boxes apply when it closes; the
  Sort, Filter, Snooze and Run in menus open and close by `ui`, and Edit
  and Done open and close the prompt editor (Edit puts the focus in it). The route tests in `app/`
  (`InboxRoute.test.tsx`, `InboxListTools.test.tsx` and `InboxPhone.test.tsx`, with
  `inboxRouteHelpers.ts`) use each of them through the route. `InboxDetail` picks
  the detail by kind: `NextStepDetail`, `QuestionDetail` or
  `RunningDetail`; on a tablet a started next step's `RunCard` stays at
  the bottom, and the whole prompt opens in a sheet. In a detail at least
  1600 px wide the task column widens to 1024, the prompt shows eight
  lines in place of five (`useWideDetail`), and the discussion is a side
  pane in `DetailSplit` with its chat in `ChatColumn` (screen review R1
  to R3, `app/InboxWide.test.tsx`). On the phone Snooze
  and Dismiss are icons in the nav, Start and the answer are pinned above
  the tab bar (`PinnedAction`), Sort and Filter are icons, the Filter menu
  and the Run in picker are sheets, a long-press on a row opens its
  actions sheet (`RowActionsSheet`, `ui.actionsFor`; on the tablet too), and while the prompt
  editor is open the keyboard hides Start and the tab bar. The phone's
  Sort menu is a sheet too; an applied sort or filter puts a dot on its
  icon, a sort other than the first adds a line with Reset under the
  tools, and the chip row scrolls the selected chip into view. A
  search's Done hint has Show it, which selects the Done chip; a state
  with no Done days then lists its search's `done`. The Running row of
  the list states (T6, M11) opens the task page (T4), as the notes say;
  Open in Workspaces is disabled until the Workspaces page exists
  (`OpenInWorkspaces`). On a tablet or phone a tap on a row the state has
  no detail for opens its own page (`RowDetail`, `ui.rowOpen`, screen
  review R11): what its row knows, Back, and ⋯, which opens its actions
  sheet. Back shows the list at the scroll it had when the row opened. Reply here
  on a started task's run card shows its chat (`ui.chatOpen`, the card's
  `chat`) in the task's place at every size; Back closes it. In the
  whole prompt's dialog or sheet, Edit prompt opens the editor and Copy
  copies the prompt. Discuss opens the
  task's discussion (`ui.discussOpen`): on the desktop the list hides and
  `DiscussionPanel` sits beside the task; on a tablet or phone
  `DiscussionPage` takes the task's page, with no tab bar, and Back
  returns to the task. On the phone Discuss sits in the nav, the model
  and context in the task card, the suggestions stack under "Try" (a
  suggestion fills the reply box) and the remove confirm is a sheet
  that starts on Keep it. `screens/discussionView.ts` (pure, tested in
  `discussionView.test.ts` beside this file) applies what Erik did to the
  proposals (`ui.proposals`, `ui.proposalChecks`): an applied update puts
  its prompt in the task, created tasks join Next steps with a toast, a
  discarded proposal leaves, an applied removal shows the task as
  removed (the remove proposal's `removed`: its Done line, and on its
  page Open discussion and Restore); its effects say what each press
  changes (Apply, Discard, Edit first, Undo, Create, Remove task,
  Restore, which puts the task back in its group). Send in the
  discussion's reply box adds Erik's message after its entries
  (`ui.sent`); the box has no attach button until a file flow is designed.
  Undo in the toast also takes out the rows a state draws as created
  (`toast.created`, D18 and T21). The removal flow
  stays as built (d-101; the M25 note calls it undecided). Start on a next step starts it
  (`ui.started`): `screens/startView.ts` (tested in
  `discussionView.test.ts`) shows the launch's `start`, the run card of
  the chat D5 shows, whose Reply here opens that chat. D7's Open chat
  opens the finished chat.
- Every detail keeps its Back bar at the top and its reply box or pinned bar
  at the bottom while only the content between them scrolls (d-107): the
  library `ScrollFrame` in `RunningDetail` and `DiscussionThread` (on a
  tablet or phone the frame is the shell detail's own child, with the
  page's padding, so AppShell docks the reply box on the keyboard, R21;
  the frame's body is `position: relative`, so a message's hidden name,
  which the library positions absolutely, scrolls with the list and stays
  above the reply box, R22; `app/InboxKeyboardDock.test.tsx`), and
  the shared block `DetailFrame` (in `web/src/blocks/`; a pinned bar
  sticky at the end of the scrolling item) in `NextStepDetail` and
  `QuestionDetail`. `InboxStickyBars.test.tsx`
  (in `app/`) scrolls each and checks both bars stay in view, and that a
  long draft keeps Send in reach.
- `blocks/`: `BackToInbox` (Back on a tablet or phone), `InboxRow` (one row of a group), `ListTools` and
  `FilterMenu` (search, Sort and its menu, Filter and its menu),
  `MenuSection` (a menu's labelled section, in a popover or a sheet),
  `PinnedAction`, `RowActionsSheet`, `RowDetail` (the page of a row with no detail, R11),
  `DetailHead` (with the Snooze menu), `DetailSection`, `PromptSection`
  and `PromptDialog` (a sheet on a tablet or phone), `RunInCard` and `RunInPicker`, `RunCard` (a started
  next step's chat, or how a removed one ended) and `OpenInWorkspaces` (disabled
  until the Workspaces page exists), `NotesBox`,
  `SourceList`, `ChatEntry`, `InboxStatus` (a pill), `AppliedFilters`
  (the filters that apply, under the tools), and the discussion:
  `DiscussionPanel`, `DiscussionThread` (its entries and reply box, which
  the panel and the page share), `ModelContext`, `DiscussionGuard`,
  `DiscussionEmpty`, `DiscussionEntry`, `ProposalCard` (a proposed update,
  new tasks or a removal) and `RemoveDialog`.
- `states/`: D1 `nextStep`, D2 `question`, D3 `promptEditing`, D4
  `filterOpen`, D5 `running`, D6 `runningTask`, D7 `done`, D8
  `promptRead`, D9 `sortOpen`, D10 `search`, D11 `sortedByProject`, D12
  `snoozeOpen`, D13 `filtered`, D14 `discussOpen`, D15 `changeProposed`,
  D16 `changeApplied`, D17 `tasksProposed`, D18 `tasksCreated`, D19
  `removalProposed`, D20 `removeConfirm`, D21 `removed`; tablet T1
  `list`, T2 `taskPage`, T3 `question` (with D2), T4 `runningTaskPage`,
  T5 `chat`, T6 `runningList`, T7 `doneList`, T8 `promptSheet`, T9
  `sortList`, T10 `searchList`, T11 `sortedList`, T12
  `promptEditingPage`, T13 `snoozePage`, T14 `filterList`, T15
  `filteredList`, T16 `discussTask`, T17 `discussionPage`, T18
  `changeProposedPage`, T19 `changeAppliedPage`, T20 `tasksProposedPage`,
  T21 `tasksCreatedList`, T22 `removalProposedPage`, T23
  `removeConfirmPage`, T24 `removedList`; phone M1 `list`, M2
  `taskPage`, M3 `promptKeyboard`, M4 `runInSheet`, M5 `questionPhone`,
  M6 `rowActions`, M7 `filterList`, M8 `chat`, M9 `promptSheet`, M10
  `runningTaskPage`, M11 `runningList`, M12 `doneList`, M13 `sortList`,
  M14 `searchList`, M15 `sortedList`, M16 `filteredList`, M17
  `discussTask`, M18 `discussionPage`, M19 `changeProposedPage`, M20
  `changeAppliedPage`, M21 `tasksProposedPage`, M22 `tasksCreatedPhone`,
  M23 `removalProposedPage`, M24 `removeConfirmPage`, M25
  `removedPhone`. D16 is D15 with the update
  applied in its `ui`. A T
  state that shows only the list sets `selectedId` to null. The others start
  from `nextStep` and its `nextStepGroups`; D9 to D11 and D13 start from
  `runningTask`, D15 to D20 from `discussOpen`, D21 from `removalProposed`
  with the removal in its `ui` and D7's Done days.
  `nextStep` also holds what every state shares: the Sort, Filter and
  Snooze menus, the Run in picker and the row tags the Filter menu
  matches; a state that shows a menu or a sort only sets its `ui`.
- `types.ts`: `InboxData` (what Figma shows; the detail is a union on
  `kind` and carries its item's `id`, which Snooze, Mark done, Dismiss and a removal act on
  in every layout, even with nothing selected, and a next step's `launch` a union on `stage`: suggested or
  started) and `InboxUi` (filter, selected id, open groups, whether
  the Filter or Sort menu, the prompt editor or dialog, the Run in
  picker, the Snooze menu, a row's actions sheet, the discussion, the started task's chat or the remove dialog is open,
  the sort, the Filter menu's boxes and the filters that apply, the
  items snoozed, the items finished (marked done or dismissed from the
  task bar, or removed in a discussion), and what Erik did to each
  proposal and its boxes),
  each a Zod schema. `InboxData.discussion` is the open task's discussion;
  its entries are a union on `type`, and a proposal a union on `kind`;
  an update's `apply` holds what Apply makes of the task.
  `InboxDrafts` is the text Erik types in the open item (note, answer,
  prompt, reply); `InboxScreen` keeps it above `ViewportFrame`, so a
  width change that swaps the layout keeps it, and `draftProps()` gives a
  field its value props.
- `states/screens.ts`: the screen map (R10) for `screens/InboxScreens.stories.tsx`
  (`Pages/Inbox/Screens`). A state with a tablet and a phone frame (T1 and
  M1) is named for both devices, so its screen shows the phone column too.
- `LIBRARY_GAPS.md`: what the Inbox frames need that the component
  library cannot draw yet, for the batched library PR.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page. With no `?state=` the page opens on its home
(`home.ts`): D1's data with nothing selected and nothing open, so a
phone or tablet shows the list and the desktop the list beside D1's task
(`app/InboxHome.test.tsx`).
