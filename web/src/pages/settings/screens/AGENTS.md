# Settings screens

The props-only screens of the Settings page and their stories. Make one
with `pnpm new screen <Name>Screen --page settings`.

- `SettingsScreen` selects the rail's Settings gear on the desktop and the
  tab bar's More on a tablet or phone, as More holds Settings (d-119).
- The bars show the pages of `data.settings.nav`, so a nav change on the
  page shows in them at once.
- Without `push` the Notifications switch draws `data.push` and does
  nothing, so a story or a canvas board needs no store.
