# Workspaces screens

The page's screens: `WorkspacesScreen` (the desktop layout, and the
state of `ui` both layouts share) and `WorkspacesPhone` (the phone's
views, one at a time, also drawn at a tablet's width for T frames).

- Add a view for a new phone or tablet frame to `WorkspacesPhone`, not a
  new screen. Make a new screen with `pnpm new screen <Name> --page workspaces`.
- A screen reports the owner's changes with `onUiChange`; it never reads
  the store (the page entry does).
- `WorkspacesScreen.stories.tsx` (`Pages/Workspaces/States`) holds one
  story per state with its play test; `WorkspacesDevicePlays.test.tsx`
  plays the tablet and phone ones at their frame size.
- `WorkspacesScreens.stories.tsx` (`Pages/Workspaces/Screens`) draws each
  screen of `states/screens.ts` with its devices side by side (review R10).
- `WorkspacesLiveUnavailable.stories.tsx` (`Pages/Workspaces/Live
  unavailable`) draws the live-unavailable notice on desktop and phone;
  it is not a Figma state (`LiveNotice.test.tsx`).
- The phone's views with no tab bar (the chat, New chat, the subagents)
  keep their footers in `ScrollFrame` footers, which the library lifts
  above the bar.
