# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` (desktop) and `T*`
(tablet) on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=`, and from
  `inboxStore.ts` the open groups and, for the shown `?state=`, whether
  Erik closed the open item with Back (tablet or phone), the prompt or
  remove dialog, the search text he typed and the rest of what he changed
  in its `ui` (`setUi`: menus, the prompt editor, the sort, the filters,
  items snoozed, marked done or dismissed); it passes them to `InboxScreen` with the
  setters, and `onUiChange` reports the `ui` changes.
- `screens/InboxScreen.tsx`: the app shell, laid out by its width
  (`ViewportFrame`): on the desktop the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`) side by side; on a
  tablet or phone the list, or the open item under Back
  (`BackToInbox`), full width over the tab bar (`AppTabBar`), which a
  chat hides. The `viewport` prop applies only until the width is
  measured; `InboxLayout.test.tsx` checks both layouts. `InboxListPane`
  shows the list through `screens/listView.ts` (pure, tested in
  `listView.test.ts` beside this file): the state's groups less the items snoozed, marked
  done or dismissed (those two count in Done, and go at the top of Today
  when the state shows the Done list), then the filters that apply, the search and the sort, with the
  counts that follow. The Filter menu's boxes apply when it closes; the
  Sort, Filter, Snooze and Run in menus open and close by `ui`, and Edit
  and Done open and close the prompt editor. `InboxRoute.test.tsx` uses
  each of them through the route. `InboxDetail` picks
  the detail by kind: `NextStepDetail`, `QuestionDetail` or
  `RunningDetail`; on a tablet a started next step's `RunCard` stays at
  the bottom, and the whole prompt opens in a sheet. While the task's discussion is open (`ui.discussOpen`),
  the list hides and `DiscussionPanel` sits beside the task.
- `blocks/`: `BackToInbox` (Back on a tablet or phone), `InboxRow` (one row of a group), `ListTools` and
  `FilterMenu` (search, Sort and its menu, Filter and its menu),
  `DetailHead` (with the Snooze menu), `DetailSection`, `PromptSection`
  and `PromptDialog` (a sheet on a tablet or phone), `RunInCard` and `RunInPicker`, `RunCard` (a started
  next step's chat, or how a removed one ended), `NotesBox`,
  `SourceList`, `ChatEntry`, `InboxStatus` (a pill), `AppliedFilters`
  (the filters that apply, under the tools), and the discussion:
  `DiscussionPanel`, `DiscussionEmpty`, `DiscussionEntry`, `ProposalCard`
  (a proposed update, new tasks or a removal) and `RemoveDialog`.
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
  `filteredList`. A T
  state that shows only the list sets `selectedId` to null. The others start
  from `nextStep` and its `nextStepGroups`; D9 to D11 and D13 start from
  `runningTask`, D15 to D20 from `discussOpen`, D21 from `done`.
  `nextStep` also holds what every state shares: the Sort, Filter and
  Snooze menus, the Run in picker and the row tags the Filter menu
  matches; a state that shows a menu or a sort only sets its `ui`.
- `types.ts`: `InboxData` (what Figma shows; the detail is a union on
  `kind` and carries its item's `id`, which Snooze, Mark done and Dismiss act on
  in every layout, even with nothing selected, and a next step's `launch` a union on `stage`: suggested or
  started) and `InboxUi` (filter, selected id, open groups, whether
  the Filter or Sort menu, the prompt editor or dialog, the Run in
  picker, the Snooze menu, the discussion or the remove dialog is open,
  the sort, the Filter menu's boxes and the filters that apply, the
  items snoozed, and the items finished from the task bar, each marked
  done or dismissed),
  each a Zod schema. `InboxData.discussion` is the open task's discussion;
  its entries are a union on `type`, and a proposal a union on `kind`.
  `InboxDrafts` is the text Erik types in the open item (note, answer,
  prompt, reply); `InboxScreen` keeps it above `ViewportFrame`, so a
  width change that swaps the layout keeps it, and `draftProps()` gives a
  field its value props.
- `LIBRARY_GAPS.md`: what the Inbox frames need that the component
  library cannot draw yet, for the batched library PR.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page.
