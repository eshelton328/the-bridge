# T07 deviations

What still differs from Figma after the first fidelity run
(`pnpm fidelity toolkit T07`, 2026-11-17, against library 1.0.0-beta.19,
the version main pins), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentOpenTablet.ts`: D7's data
(`agentOpen`), with writing-reviewer open and `ui.from` set to the skill
writer. On a tablet the item replaces the list in the shared
`DetailFrame` (d-107), and the back row (`ToolkitItemBack`) shows the
breadcrumb Toolkit › writer › writing-reviewer; writer's crumb opens
writer again. D03, D04, D07, D08, D09, T03 and M02 give the same results
as on main (every text, position delta and rule finding).

## Checks

- Text: pass. Every Figma string is in the render and visible, with the
  breadcrumb's two `›` and writing-reviewer twice (breadcrumb and title);
  no extra text, and no covered text.
- Position: 20 of 25 layers pass, among them `back row`,
  `breadcrumb · Toolkit › writer › writing-reviewer`,
  `button · Show on map`, `meta row`, `kind badge`, `path row`,
  `path badge`, `columns`, `file preview`, `preview bar`,
  `rendered markdown`, `used in workflows`, `file · writing-reviewer.md`
  and `tab bar`. The five that fail are listed below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (441:64) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item`
  y +32, h -303). This is the d-107 structure that keeps Back in view,
  as on T03.
- **Back row.** The back row is 32 px high against Figma's 36, because
  the `md` buttons are 32 high (gap: Item action buttons), and its
  content is 24 px in from the sides where Figma has 22
  (`Container size="tablet"`, gap: Tablet item spacing). Discuss is
  99.5 px wide against 97 and ends 2 px further in, so it starts 5 px
  further left (`button · Discuss` x -5.1), as on T03.
- **Breadcrumb.** The library has no breadcrumb (gap: Item breadcrumb).
  `BackRow` draws the chevron and Toolkit; the separators, writer and
  writing-reviewer follow as text in the same label style, 6 apart, with
  writer as a plain button. The chevron is 20 px against Figma's 18. The
  breadcrumb's box passes the position check.
- **Title width.** The title writing-reviewer is 220.7 px wide and 40
  high against Figma's 206 and 38 (`441:93` w +14.7): the `heading`
  glyphs and line height, as T03's writer (+5.5). It starts in place.
- **Side under the file.** Figma draws the side (487:259) 1 px high,
  where the render's side holds Used in workflows and Files (`side`
  h +81). The files list is as wide as its longest line, where Figma's
  layer spans the column (`files` w -478.4; gap: Item file summary), as
  on T03.
- **Rendered file width.** Figma keeps the prompt's text 516 px wide
  inside the 712 px preview, so each paragraph has three and two lines;
  `MarkdownView` fills its box, so both have two lines and the text runs
  wider (gap: Rendered file text width). The preview's box still passes.
- **How it runs cards.** The one-line cards (Claude, Context) are as tall
  as their content, so they end above the Codex and Tools cards, where
  Figma makes all four as tall as the tallest, and the icons are 16 px
  against 14 (gap: Agent fact card), as on D07.
- **Item tabs.** The tabs are spaced wider: `ItemTabs` pads its list 2
  and each tab 12, where Figma has 0 and 10, so Activity starts about
  30 px further right (gap: Item tab spacing). As on D07, the How it
  works, Files, Links, Evals and Activity panels are later frames.
- **Row spacing.** Figma's rows from the meta row to the columns are
  14 px apart; no space token has 14. The item uses 20 above the meta row
  and 12 between the rows, which keeps each row within 4 px of Figma's
  (gap: Tablet item spacing).
- **Copy button and preview bar.** As on D07: the copy icon is a plain
  button with `CopyIcon` (gap: Path badge copy button), and the preview
  box and bar are drawn with the Panel's tokens (gap: File preview).
- **Tab bar.** The six tab bar items spread across the full width, where
  Figma groups them in the centre. The tab bar is the shared `AppTabBar`
  (d-105), as on T01 to T03; its box passes the position check, and a
  change to it needs the app-frame lock.

## Second review

- **Preview inset.** The prompt's heading and paragraphs start about 7 px
  further in and 6 px lower inside the preview than in Figma
  (`MarkdownView` pads 20 by 24 where Figma has 14 by 16; gap: File
  preview).
- **Kind badge.** The Agent badge is about 5 px shorter than Figma's.
  Figma draws T7's badge 27 px high and the badge of every other item
  frame 25; the render uses one `KindBadge`, which passes the position
  check here.
- **Selected tab.** Overview is white where Figma's is cyan; a library
  PR adds `ItemTabs tone="accent"` (gap: Item tab selected tone).
