# D01 deviations

What differs from the frame after round 2 of the fidelity loop
(`pnpm fidelity projects D01`, 2026-11-27, against the installed library
1.0.0-beta.135), each with its reason. The library gaps are in
`web/src/pages/projects/LIBRARY_GAPS.md`.

Since d-135 the reference is Figma node 177:2 of page "Project overview" (73:2), in place of the canvas render; a new blind review took the record with this list.

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
- **Panel headings.** "Inbox" and "Queue" are `PageHeader` at its pane
  size (15 px, the count in mono), where the frame has an 18/24 heading
  and a 13 px count: no text style is 18 px (`LIBRARY_GAPS.md`).
- **Tabs.** The tab row shows Overview, Repositories, Architecture, QA and
  Ideas, where the frame shows Overview, Repositories, Architecture and QA:
  only the tabs of shipped increments show (d-133). Repositories and
  Architecture are increment two's live slices, QA increment three's and
  Ideas increment one's, so Ideas comes after QA.
- **Row height.** The Inbox rows are 56 px apart where the frame's are
  58, so the Inbox panel is 6 px shorter and the closed "To review" row
  ends higher: the library's compact `ListRow` with a kind tile is 56 high
  (`LIBRARY_GAPS.md`, Compact list row 58).
- **Quick chat** shows as the frame draws it; no frame draws its
  composer, so it is the library Dialog on every size, and in a state
  it opens nothing.
- **Owner's name.** NCC-1701's purpose starts "The owner's personal
  workspace", where the frame has the owner's name: the secret scan's
  personal-term rule keeps the name out of `web/`. The live page shows
  the brain's own words.
- **Top.** The back row with Quick chat, the picture, the name and the
  purpose sit 4 px higher than the frame's: the page starts 24 down, as the
  home does, where the frame has 28, which no spacing token has. The tabs
  are where the frame draws them, so the gap above them is 4 px larger.
- **Rail.** The rail is the app's shared one in the default order
  (d-105, d-119): Inbox, Workspaces, Projects, Artifacts, Toolkit and More.
  The frame draws an older rail with Inbox, Workspaces, Projects and More.
  The page never changes the shared rail (`pages/projects/AGENTS.md`).
- **Sides.** The page has 40 px sides, as the home has, where the frame
  has 36, so the header and the tabs are 4 px right of the frame's.
