# Inbox page

The Inbox: items that need Erik, next steps and snoozed items, and the
detail of the selected item. Figma frames `D*` on the Main page.

- `InboxPage.tsx`: reads the loader's state, `?filter=` and the open
  groups from `inboxStore.ts`, and passes them to `InboxScreen`.
- `screens/InboxScreen.tsx`: the app shell with the rail, the list pane
  (`InboxListPane`) and the detail (`InboxDetail`).
- `blocks/InboxRow.tsx`: one row of a group.
- `states/nextStep.ts`: D1, a next step selected.
- `types.ts`: `InboxData` (what Figma shows) and `InboxUi` (filter,
  selected id, open groups), each a Zod schema.

`/inbox?state=nextStep` shows a state in development; an unknown state is
a not-found page.
