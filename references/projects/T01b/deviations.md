# T01b deviations

What differs from the frame after round 1 of the fidelity loop
(`pnpm fidelity projects T01b`, 2026-11-27, against the installed library
1.0.0-beta.135), each with its reason. The library gaps are in
`web/src/pages/projects/LIBRARY_GAPS.md`.

## Checks

- PNG reference: text, position and icons are not run.
- Rules: pass.
- Review: a blind `fidelity-reviewer` record with no P1 or P2 finding,
  sealed in `review.json`.

## Deviations

- **Panels.** The Overview tab shows no Inbox, Queue, Context drift or
  Chats panel: they are NCC-130's (the Inbox, Queue and Chats panels) and
  NCC-131's (Context drift). Under the tabs the page is empty.
- **Tabs.** The tab row shows Overview and Ideas, where the frame shows
  Overview, Repositories, Architecture and QA: only the tabs of shipped
  increments show (d-133), and Ideas is increment one's.
- **Quick chat** shows as the frame draws it and does nothing yet: its
  composer is a later part of NCC-129.
- **Owner's name.** NCC-1701's purpose starts "The owner's personal
  workspace", where the frame has the owner's name: the secret scan's
  personal-term rule keeps the name out of `web/`, so the purpose breaks
  its lines at other words. The live page shows the brain's own words.
- **Top.** The back row with Quick chat, the picture, the name and the
  purpose sit 4 px higher than the frame's: the page starts 24 down, where
  the frame has 28, which no spacing token has. The tabs are where the
  frame draws them.
- **Tab bar.** At 1133 px the iPad in landscape is narrower than the
  desktop layout's 1232 (`lib/viewport.ts`), so it draws the tablet
  layout, as T10b does. The tab bar is the app's shared one in the default
  order (d-105): Home, Inbox, Workspaces, Projects, Artifacts and More.
  The frame draws Inbox, Workspaces, Projects and More.
