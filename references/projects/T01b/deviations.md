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

- **Panels.** The Overview tab shows the Inbox, Queue and Context drift
  panels (R5, R6, R9) and no Chats panel: that is NCC-130's next PR (Chats,
  with its pager; `LIBRARY_GAPS.md`).
- **Context drift.** `ncc check` gives one line of text for each finding,
  with no repository and no kind, so the panel has a row for each finding
  (3 here) where the frame groups 22 findings by repository with a count and
  a chevron. The line over the rows says when the check ran and what it
  reads ("Checked 12m ago. Folder layout and hooks."), where the frame has a
  clock time and other checks ("AGENTS.md length, links and folder
  layout"), which wait for a later check. The heading is `PageHeader` at
  its pane size, as Inbox and Queue are.
- **Queue.** "In progress" lists the open PRs with their pills, and no
  priority mark or owner chat on a row ("the-bridge#535" without
  "· bridge-workbench"): both come from Linear, which is out of scope.
  There is no "Up next" group, so the Queue counts its open PRs: 3 where
  the frame says 8, and "In progress" 3 where the frame says 4 over three
  rows.
- **To review.** The group shows as the frame draws it, closed with 17. On
  the live page it is empty until backend-coord decides how a chat's
  Inbox item names its project.
- **Columns.** The Inbox panel is over the Queue panel, where the frame
  draws them side by side: at 1133 px the page has the tablet layout
  (`ViewportFrame`), which has one column, as T10b's card grid follows the
  tablet layout too. No token gives a panel's least width.
- **Panel headings.** "Inbox" and "Queue" are `PageHeader` at its pane
  size (15 px, the count in mono), where the frame has an 18/24 heading
  and a 13 px count: no text style is 18 px (`LIBRARY_GAPS.md`).
- **Panel gap.** One panel over the other, they are 24 apart where the
  frame has 28, which no spacing token has (`LIBRARY_GAPS.md`).
- **Tabs.** The tab row shows Overview, Repositories and Ideas, where the
  frame shows Overview, Repositories, Architecture and QA: only the tabs of
  shipped increments show (d-133). Repositories is increment two's live
  slice, and Ideas is increment one's. So Ideas sits where the frame draws
  Architecture, and the frame's QA tab is not there.
- **Quick chat** shows as the frame draws it; no frame draws its
  composer, so it is the library Dialog on every size, and in a state
  it opens nothing.
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
