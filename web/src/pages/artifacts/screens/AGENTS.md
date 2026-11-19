# Artifacts screens

The props-only screens of the Artifacts page and their stories. The
entry is `ArtifactsScreen.tsx`: it lays the page out by its width
(`ViewportFrame`) and picks the other screens.

- A screen is `PascalCase.tsx`; a pure helper is `camelCaseView.ts`,
  tested in `../<name>View.test.ts`.
- `ArtifactsScreen.stories.tsx` holds one story per state
  (`Pages/Artifacts/States`); `ArtifactsScreens.stories.tsx` holds one
  story per screen of `../states/screens.ts` (`Pages/Artifacts/Screens`).
  Add the story when you add a state; `pnpm check:states` fails without
  it.
- On a tablet or phone the library and an open artifact run under the
  tab bar (AppShell `tabBarOverlay`); a discussion page has no tab bar.
- A tablet or phone page puts its Back bar in the shared `DetailFrame`
  header, so only the page under it scrolls (d-107).
- An open card sets `ui.openId` and clears `ui.artifactClosed`; Back
  sets `ui.artifactClosed`. The desktop has no Back.
- With the discussion open on the desktop, the library's `DetailSplit`
  holds the artifact's column and `DiscussionPanel`
  (`../ArtifactDetailSplit.test.tsx`).
- Apply on a tablet or phone discussion page also closes the page
  (`proposalEffect(…, 'page')`), so the artifact shows Updated.
