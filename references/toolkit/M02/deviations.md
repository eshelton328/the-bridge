# M02 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit M02 T03 D03 D04 D07 D08 D09`, 2026-11-17,
against library 1.0.0-beta.18), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillOpenPhone.ts`: D3's data
(`skillOpen`), with writer open. On the phone the item replaces the list
in the shared `DetailFrame` (d-107): the back row stays at the top and
the item scrolls under it (`web/src/app/ToolkitStickyBack.test.tsx`, the
phone case). T03, D03, D04, D07, D08 and D09 give the same results as
before M02. The Checks below are from a rerun with library 1.0.0-beta.26
(the-bridge #60: the tab bar lies over the page) and the item tabs'
`tone` and `density` props (2026-11-17).

## Checks

- Text: pass (38 strings checked). Every Figma string is in the render
  and visible; no extra text and no covered text. `FILES 11` (487:166),
  `SKILL.md` (487:171), `references/` (487:175) and `6` (487:176) lie
  under the tab bar in both and pass since the bar lies over the page
  (see Under the tab bar).
- Position: 21 of 29 layers pass (`back row`, `button · map`,
  `meta row`, `kind badge`, `429:303`, `path badge`, `487:142`,
  `file preview`, `preview bar`, `rendered markdown`,
  `used in workflows`, `file · SKILL.md`, `file · references/`,
  `file · scripts/`, `evals link`, `tab bar`). The 8 that fail are
  listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: fail. Two `hiddenOverflow` findings: the item's ScrollFrame
  body (`div.scroll-frame__body`) and the item tabs' list
  (`div.item-tabs__list`); see Under the tab bar and Item tabs.

## Deviations

- **Under the tab bar.** Figma draws the item down to the evals link
  (y 1002), past the tab bar at y 767, so the Files heading is cut by
  the bar's top edge and the first file lines lie under it. The tab bar
  lies over the page (AppShell `tabBarOverlay`, library 1.0.0-beta.26):
  the DetailFrame body runs under the bar as Figma's item does, so
  `FILES 11`, `SKILL.md` (487:171), `references/` and `6` lie under the
  bar in both and the text check passes them. `files` passes the
  position check. The rest of the item scrolls, and the rule check
  reports the scrolling body as `hiddenOverflow`. The render is right
  here, as on Inbox M15 and Toolkit M01; the builder's write of
  `exceptions.json` for this rule was refused by the session's
  permission check, so it stays as a failure for Erik to accept.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws Overview's label cyan, as Figma's, so Evals ends inside the
  390 px screen and only Activity runs past it (the list's sideways scroll is the second `hiddenOverflow`, which Figma's
  row has too). The outline stays `border.selected` at half alpha where
  Figma's is solid cyan (no solid selected token, d-050).
- **Discuss button.** Figma's Discuss is an icon button 36 × 28; an
  icon-only `Button` is square, so Discuss is `sm`, 28 × 28, and starts
  8 px further right (`button · Discuss` x +8 w -8). Show on map is
  36 × 36, as in Figma, and the two are 8 apart. The icons are 16 px
  against Figma's 14 and 17. Gap: Item action buttons.
- **Item frame.** Figma's `toolkit` (429:284) holds the back row and the
  item, from y 42 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and runs to its last part
  (`toolkit` y +36, h +198). This is the d-107 structure that keeps Back
  in view, as on T03.
- **Columns height.** Figma's `columns` (487:143) is 314 high, 40 px
  shorter than the file preview inside it (354). The render's columns
  hold the preview, 357 high (`columns` h +43; `file preview` passes).
  Gap: File preview.
- **Side.** Figma draws the side 1 px high; the render's side holds its
  sections (`side` h +275). It starts in place.
- **File lines.** The files list is as wide as its longest line, where
  Figma's layer spans the column (`files` w -34.8), and the file lines
  with several names are about 11 px narrower, as on D03 and T03:
  `file · artifact.md  chat.md  doc.md` w -12.2,
  `file · examples.md  prd.md  ticket.md` w -11.8,
  `file · check  ste-dict  ste-stop-hook  test-check` w -10.8.
  Gap: Item file summary.
- **Row spacing.** Figma's rows from the meta row to the columns are 12
  apart, and the item uses 12. The tabs' list is 32 high, as Figma's,
  and the item adds 4 above the panel, so the description and the
  preview run 3 px lower than Figma's, within the tolerance.
- **File references.** The three references wrap as one line of code,
  two spaces apart, with a break after `references/`, as Figma's text
  does; the render's code glyphs are a little wider (Geist Mono).
- **Copy button and preview bar.** As on D03 and T03: the copy icon is a
  plain button with `CopyIcon` (gap: Path badge copy button), and the
  preview box and bar are drawn with the Panel's tokens (gap: File
  preview).
- **Tab bar.** The shared `AppTabBar` passes the position check, and its
  five items line up with Figma's.

## Second review

- **Preview inset.** The SKILL.md preview's content sits about 2 px
  further in from the top and left, so the box is about 3 px taller
  (gap: File preview).

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
