# Inbox screens

The props-only screens of the Inbox and their stories. The entry is
`InboxScreen.tsx`: it lays the page out by its width (`ViewportFrame`)
and picks the list pane, the detail by kind and the discussion page.

- A screen is `PascalCase.tsx`; a pure helper is `camelCaseView.ts`,
  tested in the page folder.
- `InboxScreen.stories.tsx` holds one story per state
  (`Pages/Inbox/States`); `InboxScreens.stories.tsx` holds one story per
  screen of `../states/screens.ts` (`Pages/Inbox/Screens`). Add the story
  when you add a state; `pnpm check:states` fails without it.
- Keep `InboxDrafts` (the text the owner types) above `ViewportFrame`,
  so a width change that swaps the layout keeps it; give a field its
  value with `draftProps()`.
- The `viewport` prop applies only until the width is measured
  (`../InboxLayout.test.tsx`).
- On a tablet or phone the item's `DetailFrame` is the shell detail's own
  child, so Start, the answer and the run card stick above the tab bar
  (`app/PhoneTabBar.test.tsx`).
- A `ScrollFrame` on a tablet or phone is the shell detail's own child, so
  AppShell docks the reply box on the keyboard (R21), and its body is
  `position: relative` (R22) (`app/InboxKeyboardDock.test.tsx`).
- The space under a chat's reply box is the frame's `foot`
  (`compactChatFoot`), never its bottom padding, so on the keyboard the
  box sits on the keyboard's top (`app/InboxReplyDock.test.tsx`).
