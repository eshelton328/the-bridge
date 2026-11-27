# D01 deviations

What differs from the frame after round 2 of the fidelity loop
(`pnpm fidelity projects D01`, 2026-11-27, against the installed library
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
