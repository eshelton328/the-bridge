# D04 deviations

What still differs from Figma after the last round of the fidelity loop
(`pnpm fidelity toolkit D03 D04`, 2026-11-17, against the installed
library 1.0.0-beta.10), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleOpen.ts`: T1's list with the Workflows
and Hooks groups added, and the rule skills open beside it. D03 gives the
same results as before D04. The numbers below are from the run with
library 1.0.0-beta.15 and `FilterChips padding="none"`, which library
#115 added. The Checks below are from a rerun with library 1.0.0-beta.25
and the item tabs' `tone` and `density` props (2026-11-17).

## Checks

From `pnpm fidelity toolkit` on 2026-11-18, after the list rows moved to
`ListRow padding="pane"` and the pane's kind chips to `FilterChips
fade="none"` (library 1.0.0-beta.65), with the frame's
`exceptions.json`.

- Text: pass. `exceptions.json` excepts 34 Figma strings (`Workflows`,
  `2`, `RULES`, `8`, `commits-and-prs`, `rules/commits-and-prs.md`, `→1
  ←5`, `rules/diagrams.md`, `linear`, `rules/linear.md`, `readmes`,
  `rules/readmes.md`, `→1 ←4`, `releases`, `rules/releases.md`, `→0 ←0`,
  `ste100`, `rules/ste100.md`, `writing`, `rules/writing.md`, `→6 ←3`,
  `WORKFLOWS`, `2`, `skill-eval-cases`, `workflows/skill-eval-cases.md`,
  `→3 ←1`, `skill-eval-round`, `workflows/skill-eval-round.md`, `HOOKS`,
  `1`, `commit-msg`, `hooks/commit-msg`, `→1 ←1`, `rules/skills.md`) and
  29 render strings (`SKILLS`, `agents-md`, `skills/agents-md/`, `→0
  ←1`, `ambitious`, `skills/ambitious/`, `audit-slop`,
  `skills/audit-slop/`, `→1 ←2`, `skills/eval-cases/`, `→3 ←3`,
  `mermaid-diagrams`, `skills/mermaid-diagrams/`, `pr-description`,
  `skills/pr-description/`, `project-setup`, `skills/project-setup/`,
  `skills/readme/`, `skills/writer/`, `→7 ←4`, `AGENTS`,
  `diagram-reviewer`, `agents/diagram-reviewer.md`, `eval-case-writer`,
  `writer`, `agents/eval-case-writer.md`, `eval-grader`,
  `agents/eval-grader.md`, `→0 ←2`); each is explained below.
- Position: 21 of 55 layers pass. 16 are excepted in `exceptions.json`
  (`group · SKILLS`, `toolkit row · agents-md`, `toolkit row ·
  ambitious`, `toolkit row · audit-slop`, `toolkit row · eval-cases`,
  `toolkit row · mermaid-diagrams`, `toolkit row · pr-description`,
  `toolkit row · project-setup`, `toolkit row · readme`, `group ·
  AGENTS`, `toolkit row · diagram-reviewer`, `toolkit row ·
  eval-case-writer`, `toolkit row · eval-grader`, `toolkit row ·
  pr-description-checker`, `toolkit row · readme-cold-reader`, `toolkit
  row · writing-reviewer`). The 18 that fail: `group · RULES` y +1072;
  `toolkit row · commits-and-prs` y +1075; `toolkit row · diagrams` y
  +1074; `toolkit row · linear` y +1073; `toolkit row · readmes` y
  +1072; `toolkit row · releases` y +1071; `toolkit row · skills` y
  +1070; `toolkit row · ste100` y +1067; `toolkit row · writing` y
  +1066; `group · WORKFLOWS` y +1065; `toolkit row · skill-eval-cases` y
  +1068; `toolkit row · skill-eval-round` y +1067; `group · HOOKS` y
  +1066; `toolkit row · commit-msg` y +1069; `427:627` w +8; `file
  preview` w -5.6; `preview bar` w -5.6; `rendered markdown` w -5.6.
  Each is explained below.
- Rules: pass. 2 findings are excepted in `exceptions.json`:
  `hiddenOverflow` on `[data-figma="toolkit list"]`; `hiddenOverflow` on
  `[data-figma="filter · chips"] > div.filter-chips__root`.

## Deviations

- **List scroll.** Figma draws the list pane scrolled to the Rules group
  under a pinned header, chips and search. The render's pane starts at
  its header with the Skills group first, as in D3: no page builds its
  own sticky layout until the library's `ScrollFrame` arrives with the
  move to 1.0.0-beta.15 in bridge-inbox's PR (d-107). So the Rules,
  Workflows and Hooks groups sit about 1070 px lower than Figma's and
  below the frame's bottom edge, and the Skills and Agents rows fill the
  pane in their place. With the 52 px rows (see Row height) the
  eval-case-writer and eval-grader rows now come above the frame's foot
  too, so their text (`agents/eval-case-writer.md`, `eval-grader`,
  `agents/eval-grader.md`, `→0 ←2`) joins the excepted Skills and Agents
  strings. Each key is off by: `group · RULES` y +1072; `toolkit row ·
  commits-and-prs` y +1075; `toolkit row · diagrams` y +1074; `toolkit
  row · linear` y +1073; `toolkit row · readmes` y +1072; `toolkit row ·
  releases` y +1071; `toolkit row · skills` y +1070; `toolkit row ·
  ste100` y +1067; `toolkit row · writing` y +1066; `group · WORKFLOWS`
  y +1065; `toolkit row · skill-eval-cases` y +1068; `toolkit row ·
  skill-eval-round` y +1067; `group · HOOKS` y +1066; `toolkit row ·
  commit-msg` y +1069.
- **Row height.** Each list row is 52 px high against Figma's 53, and
  the open item's row 52 against its 55 (`ListRow padding="pane"`,
  library 1.0.0-beta.65); 53 and 55 are off the 4 px grid (d-100), so 52
  is the decision. The kind tile, the name over the path and the counts
  sit centred down the row, as in Figma; the tile is 11 px in against
  Figma's 10, since 10 needs a 9 px padding that no space token has
  (gap: Toolkit row (pane)). Each row starts higher than Figma's by 1 px
  for each row above it and 3 px after the open item's row, and the
  group headers are 3 px taller than Figma's 27. The rows' keys are off
  by the List scroll, and listed there. The list still runs past the
  frame's foot, so the pane scrolls on its own (`hiddenOverflow` on
  `[data-figma="toolkit list"]`, in `exceptions.json`).
- **File preview width.** The preview is 554.4 px wide against Figma's
  560: no size token has 560 or 364, and the columns share the row 3 to 2
  even with the side column empty (gap: Item overview columns):
  `file preview` w -5.6, `preview bar` w -5.6, `rendered markdown`
  w -5.6.
- **Description width.** The description is 948 px wide, the content
  width, against Figma's 940 (`427:627` w +8): Figma's text box ends at
  its longest line, and the render's paragraph fills its column. The two
  lines break at the same word.
- **Load box.** The box that says when the rule loads is 46 px high and
  514 wide against Figma's 42 and 512: `Panel tone="needsYou"` pads 12
  above and below and 16 at the sides, where Figma has 10 and 14 (gap:
  Rule load box). It passes the position check; the preview under it
  starts 4 px lower.
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36 (gap: Item action buttons). Both pass the position
  check.
- **Copy button.** The copy icon in the path badge is a plain button
  with the library's `CopyIcon`, styled with tokens (gap: Path badge copy
  button).
- **File preview bar.** The box and its bar are drawn with the Panel's
  tokens around `MarkdownView`; the file icon is 16 px against Figma's 14
  (gap: File preview).
- **Nothing links to the rule.** The note says the page says so when
  nothing links to an item. The frame's side column (`side`, 427:652,
  364 × 118) has no layers, so the render leaves the side column empty
  and adds no text; the list row shows `←0`.
- **Selected tab.** `ItemTabs tone="accent"` (library #126, beta.21)
  draws Overview's label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050).
- **Other tabs.** How it works, Files, Links, Evals and Activity show
  empty panels: they are later frames (D7 to D9).
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (427:427)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 427:427 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (427:432)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 427:432, as for `icon/artifacts`.

## Second review

- **All chip.** The render draws All as the selected chip, because the
  filter is All; Figma D4 draws no chip selected, as D3 does. The app
  keeps one rule for every frame: the chip of the current filter is
  selected (see D03).
- **Preview line break.** The narrower preview (554 against 560 px)
  moves "nobody" to the second line of the first paragraph (gap: Item
  overview columns).

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
