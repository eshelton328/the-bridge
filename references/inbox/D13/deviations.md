# D13 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D13`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.5 (#104 to #106) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; the hidden Reset and Edit and the hidden-count layer name are excepted in `exceptions.json`.
- Position: 9 of 18 layers pass (`inbox list`, `header`, `filter · chips`, `list tools`, `filters applied`, `group · NEEDS YOU`, `task pane`, `task bar`, `title block`).
- Rules: pass.

## Deviations

- **List row heights.** Rows use `ListRow density="compact"` (#99):
  13 px titles (`labelSm`, 13/16) and 11 px mono meta (`monoSm`,
  11/16). A title and meta row is 58 px against Figma's 55: Figma's
  text boxes are 17 and 14 px high, and the library keeps line heights
  on the 4 px grid (d-072). Each group below the first starts lower (NEXT STEPS y +20, SNOOZED y +27, RUNNING y +31; the hidden-count line y +38).
- **Group headers.** 38 px high against Figma's 34 (`h +4` on each group
  header): the library's `GroupHeader` after the 4 px grid (#96).
- **Filters that apply.** The row (`filters applied`) passes. The library
  has no removable filter chip (Figma 359:993: 22 px high, `monoSm`, a
  cyan border and an x), so each value is a pressed `Button size="sm"`
  with a `CloseIcon`: 28 px high, in the button's `label` style. Clear is
  a link in `small` and `fg.accent`.
- **Filter · 1.** The Filter button shows the count and is pressed, as
  Figma's; Search narrows to make room for it, as in Figma.
- **Hidden count.** "1 task hidden by filters" in `small`, `fg.muted`.
  get_metadata gives the layer's name ("hidden count") as its text, so
  `exceptions.json` excepts the name and allows the text frame.png shows.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21
  px apart and its mono boxes 14 px high; the library keeps 20 and 16 (4
  px grid). The prompt's five lines hold all of it, so it does not fade
  where Figma fades its fifth line (`section · SUGGESTED PROMPT` h -2).
  Since beta.5 the prompt's `bodySm` sits on a block around `Clamp`, not
  on an inline span: there its 13 px text in the panel's 14 px line made
  21 px lines, and the faded `Clamp` (#104), which now cuts at five
  lines' height with no ellipsis, would hide the fifth. Five 20 px lines
  are 100 px, not 105, so the prompt is 5 px shorter and the layers
  below it 5 px higher.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUNNING CARD y +10, MY NOTES y +13, SOURCES y +27.
- **Detail inset.** The column starts at x 524 instead of 520 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Hidden Figma text.** Figma keeps Reset and Edit in the prompt header
  as hidden layers (a sent prompt is read-only); `exceptions.json`
  excepts them, as in D06.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `running card` x +4, y +10, h +1 (was x +4, y +15, h +1);
  `section · MY NOTES` x +4, y +13, h +12 (was x +4, y +18, h +12);
  `section · SOURCES` x +4, y +27, h +2 (was x +4, y +32, h +2);
  `section · SUGGESTED PROMPT` x +4, y +10, h -2 (was x +4, y +10, h
  +3). The cause is the prompt's 20 px lines (see "Detail text").

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D13.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Needs-you row actions (Allow once, Deny, Open chat) larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size".
- Newest and Filter wider, Search narrower: recorded. Newest and Filter
  are `Button`s with 14 px labels against Figma's Medium 13 (403:1663,
  403:1671), so they are wider and Search takes what is left (row
  "Button label size"). Fixed by beta.5: Newest and Filter take
  `Button textSize="sm"` (Medium 13) and the search field
  `SearchField textSize="sm"` (13 px).
- Tag chips larger and whiter: colour fixed. The chips are now `MetaChip tone="muted"` (Figma #8a97b8, `fg.muted`); the NCC chip keeps `tone="issue"`. Their widths match Figma's within 1 px (88.8, 141.6 and 75.6 against 88, 141 and 75); they are 26 px high against 24 because `monoSm` keeps a 16 px line on the 4 px grid (d-072).
- MY NOTES text larger: fixed (see the sizes above).

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and
  the title "Workspaces is not built yet", keeps the focus and does
  nothing on a press (`InboxRoute.test.tsx`); since beta.5 (#105) a
  disabled secondary `Button` no longer fades: it keeps its fill and
  border and only its label and icon turn `fg.muted`, where Figma draws
  it enabled.
