# D10 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D10 D06 D03 D07 D14 D13`, 2026-11-18, against the
installed library 1.0.0-beta.31), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/scriptExplained.ts`: D6's data (the list has
T1's data), with writer open on its Files tab and its script check on
Explain. D06, D03, D07, D14 and D13 give the same results as before D10
(each report's text, position and rule results are unchanged). The frame
has no `exceptions.json`.

## Checks

- Text: fail. All Figma strings are in the render, nothing extra shows,
  and no text is covered by another element. Six strings are not visible,
  all in the list pane, which D6 shares:
  - `Workflows` and `2` (440:1006, 440:1007), the Workflows chip, which
    the chip row cuts at the list pane's edge, as Figma does (see Kind
    chips).
  - `agents/eval-case-writer.md` (440:1121), and `eval-grader`,
    `agents/eval-grader.md` and `→0 ←2` (440:1130, 440:1131, 440:1133):
    the taller list rows push them past the frame's bottom edge (see Row
    height).
- Position: 27 of 51 layers pass, among them every layer of the Files tab:
  `file browser`, `tree`, `viewer`, `viewer bar`,
  `toggle · Explain | Code`, `explain` and `used by`; and `toolkit list`,
  `header`, `read-only`, `filter · chips`, `search`, `group · SKILLS`,
  `toolkit item`, `meta row`, `kind badge`, `button · Discuss`,
  `button · Show on map`, `440:1198` (the title writer), `path row` and
  `path badge`, and the rail's items `rail · Inbox`, `rail · Workspaces`,
  `rail · Projects`, `rail · Artifacts`, `rail · Toolkit` and
  `rail · More`. The tree's rows and the parts inside the explanation have
  no `data-figma`: `FileTree` and `ScriptExplanation` draw them, and they
  take no attribute for a row, a step or the overview card.
- Rules: fail. Two `hiddenOverflow` findings: the list pane scrolls on
  its own (`[data-figma="toolkit list"]`), and the kind chips scroll
  sideways (`[data-figma="filter · chips"] > div.filter-chips__root`), as
  on D6. On Explain no code shows, so D6's third finding (the code's
  sideways scroll) is not in this frame.

## Deviations

- **Row height.** Each list row is 62 px high against Figma's 53
  (`h +9` on every row key), as on D3 and D6: `ListRow` pads 10 inside a
  1 px border (gap: Toolkit row (pane)). The first row starts within the
  tolerance and each row after it 9 px lower again:
  `toolkit row · agents-md` h +9; `toolkit row · ambitious` y +12;
  `toolkit row · audit-slop` y +21; `toolkit row · eval-cases` y +30;
  `toolkit row · mermaid-diagrams` y +39;
  `toolkit row · pr-description` y +48;
  `toolkit row · project-setup` y +57; `toolkit row · readme` y +66;
  `group · AGENTS` y +82; `toolkit row · diagram-reviewer` y +85;
  `toolkit row · eval-case-writer` y +94;
  `toolkit row · eval-grader` y +103;
  `toolkit row · pr-description-checker` y +112;
  `toolkit row · readme-cold-reader` y +121;
  `toolkit row · writing-reviewer` y +139.
- **Rules group.** The list has T1's data, so the Rules group lies below
  the frame: `group · RULES` and its rows `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100` and
  `toolkit row · writing` have no layer in the frame (`noLayer`), as on
  D6.
- **Kind chips.** The chip row is wider than the list pane and scrolls
  sideways; Figma cuts the Workflows chip at the same edge, so `Workflows`
  and `2` are not visible in either.
- **Explanation spacing.** The library's `ScriptExplanation` pads 20
  where Figma pads 18, and its overview card pads 16 by 12 where Figma's
  pads 15 by 13, so the overview, the walkthrough label and the steps sit
  about 2 px further in and lower. The facts' values start 10 px after the
  widest key (Exit), about 8 px left of Figma's, which puts each value 50
  after its key. The step numbers are 24 px circles against Figma's 22,
  and the note's spark icon is 12 px against 13. Step 2's text wraps one
  word earlier ("stop" moves to the second line). The `explain` box and
  the `used by` line under it pass the position check (gap: Script
  explanation).
- **Switch height.** The Explain and Code switch is 32 px high
  (`ViewSwitch` at `md`) against Figma's 34, so the viewer's bar is 52
  high against 54 and the explanation starts 2 px higher; the switch and
  the bar pass the position check (gap: Explain and Code switch).
- **Tree rows.** As on D6, `FileTree` indents a folder's files 16 px, puts
  a folder's role line under its name (so the evals/ line wraps), shows a
  closed chevron before each eval case folder, and draws rows 26 px high
  and 28 apart against Figma's 27 and 29 (gap: File tree rows).
- **Tree width.** The tree column is 328 px wide (`shell.sidebar`)
  against Figma's 330, and the viewer 618 against 616; both pass the
  position check (gap: File browser).
- **Browser foot.** Figma's box runs 6 px past the frame's foot (it ends
  at 988); the render's ends at the frame's foot, 982. The open tab panel
  grows to fill the pane through a selector on the library's DOM (gap:
  Item tab panel fill).
- **Copy button.** The copy icon in the viewer's bar is a plain button
  with the library's `CopyIcon`, styled with tokens, as the path badge's
  is (gap: Path badge copy button).
- **Buttons.** Discuss and Show on map are both 32 px high, against
  Figma's 34 and 36, as on D3 (gap: Item action buttons). Both pass the
  position check.

## Second review

- **Navigation rail.** The rail's items from Inbox down sit 4 to 5 px
  higher than Figma's. The rail is the shared app frame, not the
  Toolkit page; D14's second review found the same and sent it to the
  coordinator.
