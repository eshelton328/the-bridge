# Settings page

The Settings page (d-119): the owner's settings on this device. Read
[../AGENTS.md](../AGENTS.md) first: it says what each file of a page
folder is for and the rules of every page.

- Settings has no Figma page. Its frames are PNG references
  (`references/settings/`, lab a52ab2d4 + d-119): the fidelity tools run
  the rule check and need a `fidelity-reviewer` record, sealed in each
  frame's `review.json` (`pnpm check:reviews`).
- It opens from the rail's Settings gear on the desktop and, on the phone
  and the tablet, from the More drawer's Settings row or its tab when the
  owner moves it into the bar (d-119). Settings is an entry of the bar
  order with no switch, last by default: the owner can move it but never
  hide it, so it is in the tab bar or under More.
- The Navigation list draws a line, "Under More on this device", after the
  last entry in this device's tab bar; the bar has no More when every
  shown entry fits (5 on the phone, 6 on the iPad,
  `app/NavBarLimitRoute.test.tsx`).
- Four sections: Appearance, Navigation, Notifications and New chat
  defaults. The Notifications section (bridge-coord, 2026-11-23) is the
  one place of the d-118 switch; the rail and the drawer no longer draw it.
  Below it, "Show message preview" (on by default) is a device setting
  that goes to the server with the subscription, again at each change
  while push is on (`app/PushSwitchRoute.test.tsx`).
- The page reads no server. With no `?state=` the entry shows the store's
  settings (`state/settingsStore.ts`) and the live switch
  (`state/pushStore.ts`); each change goes to the store, which saves it.
- Appearance's Chat width (Full, Wide, Narrow) sets the Workspaces chats'
  column on the tablet and the desktop (`ChatPane`); the phone shows it
  off with "Phone: always full" (`app/ChatWidthRoute.test.tsx`).
- Text size is disabled with "Coming soon" until step D uses the library's
  text size sets (`LIBRARY_GAPS.md`).
- `app/SettingsRoute.test.tsx` and `app/PushSwitchRoute.test.tsx` test the
  page on the owner's path at 390, 744 and 1512 px.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change a screen
  or its stories.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block of this page.
- [states/AGENTS.md](states/AGENTS.md): read before you add a state or
  change the screen map.
