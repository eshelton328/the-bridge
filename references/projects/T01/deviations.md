# T01 deviations

What differs from the frame after round 2 of the fidelity loop
(`pnpm fidelity projects T01`, 2026-11-27, against the installed library
1.0.0-beta.135), each with its reason. The library gaps are in
`web/src/pages/projects/LIBRARY_GAPS.md`.

## Checks

- PNG reference: text, position and icons are not run.
- Rules: pass.
- Review: a blind `fidelity-reviewer` record with no P1 or P2 finding,
  sealed in `review.json`.

## Deviations

- **Panels.** The Overview tab shows the Inbox and Queue panels (R5, R6)
  and no Context drift or Chats panel: those are NCC-131's (Context drift)
  and NCC-130's next PR (Chats, with its pager; `LIBRARY_GAPS.md`).
- **Queue.** "In progress" lists the open PRs with their pills, and no
  priority mark or owner chat on a row ("the-bridge#535" without
  "· bridge-workbench"): both come from Linear, which is out of scope.
  There is no "Up next" group, so the Queue counts its open PRs: 3 where
  the frame says 8, and "In progress" 3 where the frame says 4 over three
  rows.
- **To review.** The group shows as the frame draws it, closed with 17. On
  the live page it is empty until backend-coord decides how a chat's
  Inbox item names its project.
- **Panel headings.** "Inbox" and "Queue" are `PageHeader` at its pane
  size (15 px, the count in mono), where the frame has an 18/24 heading
  and a 13 px count: no text style is 18 px (`LIBRARY_GAPS.md`).
- **Panel gap.** One panel over the other, they are 24 apart where the
  frame has 28, which no spacing token has (`LIBRARY_GAPS.md`).
- **Tabs.** The tab row shows Overview and Ideas, where the frame shows
  Overview, Repositories, Architecture and QA: only the tabs of shipped
  increments show (d-133), and Ideas is increment one's.
- **Quick chat** shows as the frame draws it; no frame draws its
  composer, so it is the library Dialog on every size, and in a state
  it opens nothing.
- **Owner's name.** NCC-1701's purpose starts "The owner's personal
  workspace", where the frame has the owner's name: the secret scan's
  personal-term rule keeps the name out of `web/`, so the purpose breaks
  its lines at other words. The live page shows the brain's own words.
- **Top.** The back row with Quick chat sits 4 px higher than the
  frame's: the page starts 24 down, where the frame has 28, which no
  spacing token has. The tabs are 2 px lower than the frame's.
- **Picture.** The picture is 64 px square, as on T01b and D01, where
  this frame draws 56, which no size token has (`LIBRARY_GAPS.md`, Project
  picture 56). The name and the purpose keep the frame's 16 px gap, so they
  start 8 px right of the frame's.
- **Tab bar.** The tab bar is the app's shared one in the default order
  (d-105): Home, Inbox, Workspaces, Projects, Artifacts and More. The
  frame draws Inbox, Workspaces, Projects and More.
