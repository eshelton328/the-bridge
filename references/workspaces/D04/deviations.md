# D04 deviations

What still differs from Figma after the first build of the folders control,
its list and the folder picker (`pnpm fidelity workspaces D04`,
2026-11-17, fix round 3, against the installed library 1.0.0-beta.9),
each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is D03's sidebar
layout with drift check (omni-brain, Codex) in the middle, the folder
list open over the transcript and the folder picker in the side slot
(`sideWidth="side"`, 380).

## Checks

- Text: fails on one string.
  - `78%` (128:223): the library's `ContextMeter` draws the number and
    "%" as two text nodes, and the hono server row's meta is also clipped
    in the render (see `hiddenOverflow` below), so it is a real difference.
  - `42%` (128:173), `23%` (128:189), `18%` (128:259) and the chat
    header's `23%` (128:294) show in full; `exceptions.json` excepts them
    (ContextMeter percentage). `Artifacts` and `Toolkit` (rail, d-105) are
    excepted as on D01 to D03.
- Position: 16 of 35 layers pass. `128:272`, `128:273`, `128:304`,
  `128:306`, `137:2`, `137:9`, `128:330`, `128:342`, `128:349`,
  `128:355`, `128:361`, `128:367`, `128:374`, `128:381`, `128:388`,
  `128:400`, `128:410`, `128:416` and `128:424` fail.
- Rules: `hiddenOverflow` on the hono server row's meta line (128:213).
- D01, D02, D02b and D03 give the same report as before this build
  (`pnpm fidelity workspaces D01 D02 D02b D03 --skip-build`): none got
  worse.

## Deviations

- **Folder picker is 20 px narrower (Folder picker).** `128:330` x +20,
  w -20: `AppShell` has side widths 380 and 420 and Figma's picker is 400;
  the build uses 380, the width of the side chat (d-100). So the main chat
  is 22 px wider (`128:272`, `128:273` w +22, and its transcript and
  composer `128:304`, `128:306`, `137:2` w +18), and every part of the
  picker starts 18 px further right and is 15 px narrower (`128:342`,
  `128:349`, `128:355`, `128:361`, `128:367`, `128:374`, `128:381`,
  `128:388`): the panel is padded 16 against Figma's 19.
- **Picker rows (Folder picker).** The rows are `Button`s 32 high against
  Figma's 33 (recent), 35 (the chosen ~/the-bridge) and 31 (browse); the
  listed folders (Documents, omni, omni-brain, the-bridge) are in `body`
  (Regular 14) as in Figma, and the recent paths are `mono`. Close is a
  text button with an `fg.muted` class, Figma's grey. The
  folder icons are 16 px (Figma 15) and the title's is 16 (Figma 18).
- **Search field (Folder picker).** `SearchField` draws "~/the-" in `body`
  (Geist 14) against Figma's Geist Mono, adds a clear × at the end, which
  Figma has not, and has no cyan focus border or caret until it has the
  focus; Figma draws it focused with a caret after the text.
- **Add ~/the-bridge.** `128:400` x -4.9, w +7.9: the primary
  `Button size="sm"` with `textSize="smStrong"` is 145 wide against
  Figma's 137, so it starts 5 px further left.
- **Folders control (Folders control).** `137:9` w +8: a `Button size="xs"`
  spaces the folder icon, the path, "+1" and the chevron 6 apart, so the
  control is 146 wide against Figma's 138. Its cyan border while the list
  is open is the button's expanded border.
- **Folder list (Folder list).** `128:410`, `128:416` and `128:424`
  w +8, `128:424` y +5: `Popover` pads 10 against Figma's 13, so the rows
  are 8 px wider; the rows are 36 px (`Button size="lg"`) against 37 and
  Add folder 28 against 30. The × of ~/omni is part of the row's button.
  The popover opens next to its trigger, the control inside the prompt
  box, so a `mb: 40` class (the nearest spacing token, d-100) lifts it
  clear of the box, where Figma draws it; it ends 1 px from Figma's edge.
  "working folder" is `fg.muted`, a little brighter than Figma's, because
  `fg.subtle` on the row's raised fill is under the 4.5:1 contrast the
  accessibility test asks for.
- **+ in the composer (Composer add button).** Figma's composer starts its
  bottom row with a + button; `Composer` draws its attach button with a
  paperclip.
- **Main chat.** `128:306` h +6: the reply wraps in body text (14/20), as
  on D02 and D03. The composer has no cyan border; Figma draws it focused.
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 128:213 (6 px): the end of "78%" in the hono server row is cut off,
  because the library's `ContextMeter` is about 5 px wider than Figma's 83,
  as on D02 to D03.
- **Group headers (Sidebar group header).** Figma's headers in D04 have no
  count and no needs-you dot, and the build leaves them out
  (`sidebar.counts: false`), and no drag handle (`sidebar.grip: false`).
  The ⋯ buttons are 24 px.
- **Chat header (Chat header).** Figma's header in D04 has no ⋯, and the
  build leaves it out (`chatActions: false`); the header is 91 px against
  89, within the tolerance.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
