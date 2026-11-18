# M22 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit M22`, 2026-11-17, against library 1.0.0-beta.18),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookOpenPhone.ts`: D9's data (`hookOpen`),
with the hook commit-msg open. On the phone the hook replaces the list in
the shared `DetailFrame` (d-107), as M2's skill and M19's rule do: the back
row stays at the top and the item scrolls under it
(`web/src/app/ToolkitStickyBack.test.tsx`, the M22 case). D03, D04, D07,
D08, D09, T03, M02, T17, M19 and T19 give the same results as before
M22. The Checks below are from a rerun with library 1.0.0-beta.28
(2026-11-17): the phone's file preview passes `CodeLines` `wrap`
(library #132), so the long code lines wrap as in Figma.

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text and no covered text. The three code lines that were cut before
  (487:2240, 487:2243, 487:2246) wrap and pass (see Code lines). `6`
  (487:2248) and `set -u` (487:2249) pass since the tab bar lies over
  the page (see Under the tab bar).
- Position: 23 of 30 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `487:2043`, `path badge`, `487:2182`,
  `kind section · hook`, `facts`, `fact · Event`, `fact · State`,
  `badge · Enabled · icon`, `fact · Enforces`, `fact · Test`,
  `preview bar`, `file · commit-msg`, `file · test-commit-msg`,
  `tab bar`). The 7 that fail (`button · Discuss`, `toolkit`,
  `columns`, `file preview`, `code`, `side`, `files`) are listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`, see Under the tab bar) and the item
  tabs' list (`div.item-tabs__list`, see Item tabs). The code no longer
  scrolls sideways.

## Deviations

- **Under the tab bar.** Figma draws the script down past the frame's
  foot: line 4 (487:2241) runs under the tab bar at y 767, lines 5 and 6
  (`6`, `set -u`) are under it, and lines 7 to 10 and the files (487:2263)
  are below the frame. The tab bar lies over the page (AppShell
  `tabBarOverlay`, library 1.0.0-beta.26): the DetailFrame body runs
  under the bar as Figma's script does, so line 6 (`6`, `set -u`) lies
  under the bar in both and the text check passes it. The rest of the
  item scrolls, and the rule check reports the scrolling body as
  `hiddenOverflow`. This is the scroll that Figma's own layout causes,
  as on M02 and M19; it is not an exception.
- **Code lines.** Figma wraps a long line of the script under itself on
  the phone: lines 3, 4, 5 and 8 are two lines each, so the code box
  (`code` 487:2231) is 284 high. `CodeLines` `wrap` (library #132,
  beta.28) wraps them the same way in its text column, the number on the
  first line, and nothing is cut or scrolls sideways
  (`web/src/app/ToolkitCodeWrap.test.tsx`). Three differences remain, and
  they make the box 6 px taller (`code` h +6, `file preview` h +6):
  - A wrapped line is 32 px high, two lines of the 12/16 mono style on
    the 4 px grid (d-090), where Figma's is 34 (two of 17); a one-line
    line is 16 against 17. No line-height token has 17 (d-050).
  - Line 9 (`TOOLKIT_SCOPES="skills rules toolkit hooks"`, 487:2258,
    310 wide) wraps too. Figma draws it on one line, past the 298 px
    column of the wrapped lines, to 4 px from the box's edge; the
    library's text column is 302 px (the box less 16 padding at each
    side, the numbers' column and the 16 gap), so the line is two lines
    high (+15 against Figma's 17).
  - `CodeLines` pads 16 where Figma pads 14 (+4; gap: File preview).

  Lines 1 to 10 sum to 258 px against Figma's 256, and the padding adds
  4. The box ends 3 px lower than Figma's (it starts 3 px high, see Row
  spacing), and the files sit 8 under it where Figma's sit 16 (the
  overview's rows are 8 apart), so they start 5 px higher (`side` y -5,
  `files` y -5); `file · commit-msg` and `file · test-commit-msg` pass,
  where they were 82 and 83 px high before the wrap.
- **Columns height.** Figma's `columns` (487:2219) is 255 high, shorter
  than the file preview inside it (323). The render's columns hold the
  preview, 329 high (`columns` h +74). Gap: File preview; see Code lines
  for the preview's 6 px.
- **Row spacing.** Figma's description, When it runs and the code are 12
  apart. The tabs' list is 32 high, as Figma's, with 4 above the panel,
  and the cards are 110 and 111 high (Figma 109), so at 12 apart the
  code started 5 px low
  (`columns`, `file preview`, `preview bar` and `code` y +5 in the first
  run). As on M19, the phone's hook overview puts the rows 8 apart: the
  description is 3 px lower than Figma's, the cards 2 px and the code
  3 px higher. Gap: Agent fact card.
- **Fact cards.** The four cards sit two by two, 178 wide and 10 apart,
  as in Figma. They are `Panel` in its notice variant with 4 more above
  and below, as on T19: 12 in at the sides where Figma has 15, so the text
  is 6 px wider, and 110 to 111 high against 109. The State caption breaks
  after "toolkit/" as Figma's does. The head icons are 16 px against 14
  and the check in Enabled is 12 px (Figma 11). Gap: Agent fact card.
- **Event icon.** The Event card starts with the library's `BranchIcon`
  (a branch with two rings), where Figma draws `icon/git` (a commit mark).
  Gap: Git icon.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's, so Evals ends inside the
  390 px screen and only Activity runs past it (the list's sideways scroll is the second `hiddenOverflow`, which Figma's
  row has too). The outline stays `border.selected` at half alpha where
  Figma's is solid cyan (no solid selected token, d-050).
- **Discuss button.** As on M19, Figma's Discuss is an icon button
  36 × 28; an icon-only `Button` is square, so Discuss is `sm`, 28 × 28,
  and starts 8 px further right (`button · Discuss` x +8 w -8). Show on
  map passes. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (487:2024) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to its last part (`toolkit` y +36,
  h +135). This is the d-107 structure that keeps Back in view, as on M02
  and M19.
- **Description lines.** Figma breaks the description after
  "toolkit/rules/"; the browser does not break after a slash, so the
  render's first line ends at "against" and the text has four lines, as
  in Figma, with other breaks. The description passes the position check.
- **Files.** The files list is as wide as its longest line, 198 px, where
  Figma's is 366 (`files` w -168.4), as on T19 (gap: Item file summary).
  Figma's `side` (487:2262) is 1 px high; the render's side holds the
  files (`side` h +63).
- **Copy button and preview bar.** As on M19 and T19: the copy icon is a
  plain button with `CopyIcon` (gap: Path badge copy button), and the
  preview box and bar are drawn with the Panel's tokens, with a 16 px code
  icon against 14 (gap: File preview).
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.

## Second review

- **Cross glyph.** The Test card's "✗" looks like an upright "×", where
  Figma's is slanted. The text is the same character (U+2717) in both;
  only the font's glyph differs, as on T19.

## Text under the tab bar

bridge-coord decided (2026-11-17) that this frame gets no
`exceptions.json` for hidden text. Measured cause of each such failure:

- Figma draws the tab bar (`tab bar`, y 767) after these text layers, so
  `coveredInFigma` counts them as covered. The render does not draw
  them under the tab bar: the item's scroll body ends at the tab bar's
  top edge and clips them (`hiddenOverflow` on
  `main.app-shell__detail`). The text check accepts a covered Figma
  string only when the render covers it too, so it reports them as not
  visible. The reference is correct; the difference is the app frame,
  which ends the scroll body above the tab bar where Figma runs the
  content under it. A change there is a shared-frame change
  (bridge-coord). The text check stays failing.
- The three comment lines above the tab bar that failed while
  `CodeLines` kept each line on one line now wrap, as Figma's do, and
  pass (library #132, beta.28).
