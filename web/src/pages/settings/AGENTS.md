# Settings page

The Settings page (d-119): the owner's settings on this device. Read
[../AGENTS.md](../AGENTS.md) first: it says what each file of a page
folder is for and the rules of every page.

- Settings has no Figma page. Its frames are PNG references
  (`references/settings/`, lab a52ab2d4 + d-119): the fidelity tools run
  the rule check and need a `fidelity-reviewer` record, sealed in each
  frame's `review.json` (`pnpm check:reviews`).
- It opens from the rail's Settings gear on the desktop and from the More
  drawer's Settings row on the phone and the tablet (d-119). Settings is
  not a nav page: the owner cannot hide or move it.
- Four sections: Appearance, Navigation, Notifications and New chat
  defaults. The Notifications section (bridge-coord, 2026-11-23) is the
  one place of the d-118 switch; the rail and the drawer no longer draw it.
- The page reads no server. With no `?state=` the entry shows the store's
  settings (`state/settingsStore.ts`) and the live switch
  (`state/pushStore.ts`); each change goes to the store, which saves it.
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
