# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` (desktop) and `T*`
(tablet) on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=`, and from
  `inboxStore.ts` the open groups and, for the shown `?state=`, whether
  Erik closed the prompt or remove dialog and the search text he typed;
  it passes them to `InboxScreen` with the setters.
- `screens/InboxScreen.tsx`: the app shell, laid out by its width
  (`ViewportFrame`): on the desktop the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`) side by side; on a
  tablet or phone the list, or the open item under Back
  (`BackToInbox`), full width over the tab bar (`AppTabBar`), which a
  chat hides. The `viewport` prop applies only until the width is
  measured; `InboxLayout.test.tsx` checks both layouts. `InboxDetail` picks
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
  T5 `chat`, T6 `runningList`, T7 `doneList`, T8 `promptSheet`. A T
  state that shows only the list sets `selectedId` to null. The others start
  from `nextStep` and its `nextStepGroups`; D9 to D11 and D13 start from
  `runningTask`, D15 to D20 from `discussOpen`, D21 from `done`.
- `types.ts`: `InboxData` (what Figma shows; the detail is a union on
  `kind`, and a next step's `launch` a union on `stage`: suggested or
  started) and `InboxUi` (filter, selected id, open groups, and whether
  the Filter or Sort menu, the prompt editor or dialog, the Run in
  picker, the Snooze menu, the discussion or the remove dialog is open),
  each a Zod schema. `InboxData.discussion` is the open task's discussion;
  its entries are a union on `type`, and a proposal a union on `kind`.
- `LIBRARY_GAPS.md`: what the Inbox frames need that the component
  library cannot draw yet, for the batched library PR.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page.
