# Settings screens

The props-only screens of the Settings page and their stories. Make one
with `pnpm new screen <Name>Screen --page settings`.

- `SettingsScreen` selects the rail's Settings gear on the desktop. On a
  tablet or phone it selects the Settings tab when the owner moved
  Settings into the bar, else More, which holds Settings (d-119).
- It passes the Navigation list the last entry of the device's tab bar
  (`cutAfter`) when More holds the rest; none on the desktop.
- The bars show the pages of `data.settings.nav`, so a nav change on the
  page shows in them at once.
- Without `push` the Notifications switch draws `data.push` and does
  nothing, so a story or a canvas board needs no store.
