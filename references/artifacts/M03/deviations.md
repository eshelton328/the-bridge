# M03 deviations

What still differs from Figma after fix round 2 of the fidelity loop
(`pnpm fidelity artifacts M03`, 2026-11-18, against the installed library
1.0.0-beta.27; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
M3 is M1's library on the phone with T3's Filter sheet open over the tab
bar (`FilterSheet iconOnly`); the library under the scrim has M1's
differences (`../M01/deviations.md`), and the sheet has T3's
(`../T03/deviations.md`).

## Checks

- Text: passes. The Brain map prototype row (407:231) lies under the tab
  bar and the sheet in Figma and in the render.
- Position: 29 of 44 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the nine artifact rows, `tab bar`, the
  tab bar's five items, `group · UPDATED`, `check · Today`,
  `check · This week`, the footer `407:501` and
  `button · Show 7 artifacts`).
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`), as in M1: Figma's library runs to y 875, under the
  pinned tab bar, and the render scrolls the same way (d-107).

## Deviations

- **Filter sheet rows.** `sheet body` y -24, h +26, and the rows above
  Updated: `group · SOURCE` y -24, `check · Claude artifacts` y -22,
  `check · Codex sites` y -21, `group · PROJECT` y -20,
  `check · ncc-1701` y -18, `check · omni` y -16,
  `check · skill-evals` y -14, `check · omni-brain` y -12,
  `check · Not in a project` y -10, `group · FOUND BY` y -9,
  `check · Artifact hook` y -7, `check · Codex session log` y -6 and
  `check · Added by hand` y -5. As T3: the `Checkbox` rows are 32 high
  and 32 apart against Figma's 29 (28 for a mono label) and 31 or 30, and
  each section label is a 30 px `GroupHeader variant="sidebar"` row
  against Figma's 26, so the sheet's body is 512 high against 486. The
  sheet keeps its bottom where Figma has it (Show and the rows of Updated
  pass), so its top, the grabber, the title row and the first rows sit up
  to 24 px higher, and the sheet partly covers the found status line that
  Figma leaves in view above it. Library gap "Filter menu rows and
  inset".
- **Source marks.** The Claude artifacts and Codex sites rows have no
  Claude or Codex mark between the box and the label (407:290, 407:300):
  `Checkbox` takes only a text label. Library gap "Checkbox leading
  icon".
- **Source chips.** `filter · chips` w +4.2, as M1: the chips are 6 apart
  against Figma's 5 (d-072), with Figma's 9 px sides. Library gap
  "Compact chip spacing".
- **Rows under the scrim.** As M1: the previews are `Thumbnail size="md"`,
  76 × 48 as Figma's, but drawn as D2's row drawing scaled up, with window
  dots and smaller cells (library gap "Phone row preview drawing"), and
  the rows are 70 high against Figma's 66 (`ListRow
  padding=\"phone\"` pads 10 where Figma has 8 inside the border), and `RowGroup`'s `mt: -2`
  holds Figma's 68 px pitch (library gap "ListRow phone height 70 vs
  66"). New is `Badge size="xs"` with
  `SparkFilledIcon`, 51.3 × 16 against Figma's 48 × 16, as its filled star
  is 12 px against 9 (407:99, 407:100; library gap "New badge"). The
  previews' colours differ as in M1 (library gap "Thumbnail colour").
- **Show 7 artifacts.** The label is the primary button's Medium; Figma's
  looks a little heavier, as T3.
- **Device chrome.** The status bar (9:41), the home indicator (407:287)
  and the screen corners are not drawn (d-089); the checks measure the
  render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Sheet, section rows, Show and focus: T3's (`../T03/deviations.md`); M3's
  sheet has T3's insets (407:399 to 407:502).
- Filter: M1's 36 px icon-only button, pressed while the sheet is open,
  with no dot, as Figma draws it (407:61); its icon stays `fg.muted`
  while pressed, as Figma's.
- Clear: the `text` Button reaches 8 past the title row's end, so its
  label ends 1 px inside Figma's (407:405 ends at x 373).
