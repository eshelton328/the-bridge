# T19 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T19`, 2026-11-17, against library 1.0.0-beta.18),
each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookOpenTablet.ts`: D9's data (`hookOpen`),
with the hook commit-msg open. On a tablet the hook replaces the list in
the shared `DetailFrame` (d-107), as T3's skill and T17's rule do: the back
row stays at the top and the item scrolls under it
(`web/src/app/ToolkitStickyBack.test.tsx`). D03, D04, D07, D08, D09, T03,
M02, T17 and M19 give the same results as before T19.

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text, and no covered text. No string is drawn under the tab bar, and
  the item does not scroll at this size.
- Position: 18 of 26 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `487:1126`,
  `kind section · hook`, `facts`, `fact · Event`, `fact · State`,
  `badge · Enabled · icon`, `fact · Enforces`, `fact · Test`,
  `preview bar`, `file · commit-msg`, `file · test-commit-msg`,
  `tab bar`). The 8 that fail are listed below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (487:957) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item`
  y +32, h -308). This is the d-107 structure that keeps Back in view, as
  on T03 and T17.
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of `Container size="tablet"` (Figma 22)
  it starts 5 px further left (`button · Discuss` x -5.1). Gaps: Item
  action buttons, Tablet item spacing.
- **Title width.** The title commit-msg is 168.7 px wide and 40 high
  against Figma's 157 and 38 (`487:980` w +11.7): the `heading` glyphs
  and line height. It starts in place.
- **Code box.** The script is drawn with the library's `CodeLines`, which
  pads 16 and draws 16 px lines 2 apart (Figma 14 above the first line
  and 17 px lines 19 apart), so the box is 249 px high against 255
  (`columns` h -6, `file preview` h -6, `code` h -6). It starts within
  3 px of Figma's (gap: File preview). As on D9, the code keeps its full
  width in the library's `ScrollFrame`; at 712 px every line fits.
- **Side and files.** Figma has an empty `side` layer (487:1206,
  712 × 1) and the files (487:1207, 712 wide) at the same place. The
  render's side holds the files, so it is as high as they are
  (`side` h +63), and the files list is as wide as its longest line,
  198 px (`files` w -514.4), as on T03. Both start within 1 px of
  Figma's, and the two file lines pass (gap: Item file summary).
- **Row spacing.** Figma's rows (the description, When it runs and the
  code) are 14 apart; no space token has 14, so on a tablet a hook's
  overview puts them 12 apart, as T17's rule does, and the files 24 under
  the code box, which is 6 px short. Each row starts within 3 px of
  Figma's (gap: Tablet item spacing).
- **Fact cards.** The four cards are `Panel` in its notice variant, which
  pads 12 at the sides and 10 above and below, plus 4 above and below
  (Figma 15 at the sides, 13 above and below). The section variant's 16
  leaves the text 135.5 px wide against Figma's 140 and breaks
  commits-and-prs.md onto two lines. The State caption breaks after
  "toolkit/" as Figma's does. The head icons are 16 px against 14 (no
  icon token has 14) and the check in Enabled is 12 px (Figma 11). Gap:
  Agent fact card.
- **Event icon.** The Event card starts with the library's `BranchIcon`
  (a branch with two rings), where Figma draws `icon/git` (a commit mark).
  The library has no git icon (gap: Git icon).
- **Item tabs.** The tabs are spaced wider: How it works starts about
  10 px further right than in Figma, and Activity about 33 px. `ItemTabs`
  pads its list 2 and each tab 12, where Figma has 0 and 10 (gap: Item
  tab spacing). The How it works, Files, Links, Evals and Activity panels
  are later frames.
- **Selected tab.** Overview is white with a grey outline, where Figma's
  is cyan with a cyan outline. `ItemTabs` has no accent tone yet; a
  library PR adds one (gap: Item tab selected tone).
- **Copy button and preview bar.** As on D9 and T17: the copy icon is a
  plain button with `CopyIcon` (gap: Path badge copy button), and the
  preview box and bar are drawn with the Panel's tokens, with a 16 px code
  icon against 14 (gap: File preview).
- **Tab bar.** The six tab bar items spread across the full width, where
  Figma groups them in the centre. The tab bar is the shared `AppTabBar`
  (d-105), as on T01, T02, T03 and T17. Its box passes the position check,
  and a change to it needs the app-frame lock.
