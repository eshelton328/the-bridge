# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=` and the open
  groups from `inboxStore.ts`, and passes them to `InboxScreen`.
- `screens/InboxScreen.tsx`: the app shell with the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`). `InboxDetail` picks
  the detail by kind: `NextStepDetail`, `QuestionDetail` or
  `RunningDetail`.
- `blocks/`: `InboxRow` (one row of a group), `ListTools` and
  `FilterMenu` (search, Sort, Filter and its menu), `DetailHead`,
  `DetailSection`, `PromptSection`, `RunInCard` and `RunInPicker`,
  `NotesBox`, `SourceList`, `ChatEntry` and `InboxStatus` (a pill).
- `states/`: D1 `nextStep`, D2 `question`, D3 `promptEditing`, D4
  `filterOpen`, D5 `running`. The others start from `nextStep` and its
  `nextStepGroups`.
- `types.ts`: `InboxData` (what Figma shows; the detail is a union on
  `kind`) and `InboxUi` (filter, selected id, open groups, and whether
  the Filter menu, the prompt editor or the Run in picker is open), each
  a Zod schema.
- `LIBRARY_GAPS.md`: what the Inbox frames need that the component
  library cannot draw yet, for the batched library PR.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page.
