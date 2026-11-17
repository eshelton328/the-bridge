# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=`, and from
  `inboxStore.ts` the open groups and, for the shown `?state=`, whether
  Erik closed the prompt dialog and the search text he typed; it passes
  them to `InboxScreen` with the setters.
- `screens/InboxScreen.tsx`: the app shell with the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`). `InboxDetail` picks
  the detail by kind: `NextStepDetail`, `QuestionDetail` or
  `RunningDetail`.
- `blocks/`: `InboxRow` (one row of a group), `ListTools` and
  `FilterMenu` (search, Sort and its menu, Filter and its menu),
  `DetailHead` (with the Snooze menu), `DetailSection`, `PromptSection`
  and `PromptDialog`, `RunInCard` and `RunInPicker`, `RunCard` (a started
  next step's chat), `NotesBox`, `SourceList`, `ChatEntry` and
  `InboxStatus` (a pill).
- `states/`: D1 `nextStep`, D2 `question`, D3 `promptEditing`, D4
  `filterOpen`, D5 `running`, D6 `runningTask`, D7 `done`, D8
  `promptRead`, D9 `sortOpen`, D10 `search`, D11 `sortedByProject`, D12
  `snoozeOpen`. The others start from `nextStep` and its
  `nextStepGroups`; D9 to D11 start from `runningTask`.
- `types.ts`: `InboxData` (what Figma shows; the detail is a union on
  `kind`, and a next step's `launch` a union on `stage`: suggested or
  started) and `InboxUi` (filter, selected id, open groups, and whether
  the Filter or Sort menu, the prompt editor or dialog, the Run in
  picker or the Snooze menu is open), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Inbox frames need that the component
  library cannot draw yet, for the batched library PR.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page.
