# D05 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D05`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. The library behind the dialog
is D01's, so its deviations are D01's.

## Checks

- Text: passes, as D01: the view switch draws its icons alone
  (`ViewSwitch iconOnly`, library #121). Every string is visible.
  `Toolkit` is an `extra` exception, and the four card descriptions that
  Figma cuts with an ellipsis are `missing` exceptions (`exceptions.json`),
  as D01's.
- Position: 11 of 37 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`). Twenty-four
  fail; each is listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as D01's. The link and title inputs
  are `scrollBar` exceptions: they draw no scroll bar (`D05.render.png`),
  but Chrome's `clientWidth` of a text input leaves out `TextField`'s
  10 px side padding, so the check reads the 20 px as a bar.

## Deviations: the dialog

- **Dialog placement.** `dialog · Add a link` x -32, y +9, h -19. Figma
  centres the dialog over the library, right of the rail (x 518);
  `Dialog` centres it in the window (x 486), 32 px further left. It is
  19 px shorter, from the padding and the Source field below. Library gap
  "Dialog placement".
- **Dialog padding.** `field · Link` x -36, y +6, w +8, `field · Title`
  x -36, w +8, `field · Project` x -36, y -5, w +8: `Dialog size="lg"`
  pads 20 against Figma's 24, so the fields start 4 px further in from
  the dialog's edge (32 + 4 = 36 to the left of Figma's) and are 498 wide
  against 490. The close × is 16 px against Figma's 18. Library gap
  "Dialog form padding".
- **Field labels.** "Link", "Source", "Title" and "Project" are `small`
  (12/16) in `fg.muted`, `TextField`'s label; Figma's are Medium 14 in the
  default text colour, 20 high. The Source and Project labels take the
  same style, so the four match. Library gap "Field label style".
- **Inputs.** The inputs are 44 high (`TextField size="xl"`) against
  Figma's 40, with 10 px sides against 13. The link has no link icon
  before it, and the link and the project are in the body font, not
  mono. With 16 px labels and 44 px inputs each field is 88 high, so the
  fields keep Figma's 89 px pitch. Library gap "Text field height, icon
  and mono value".
- **Source choice.** `field · Source` x -36, y +5, w +8, h -9 and
  `segmented · Source` x -36, w +7: Claude artifact and Codex site sit
  side by side at the start of the field, each as wide as its label, in a
  36 px switch (`ViewSwitch size="lg"`) with 12 px kind marks; Figma's
  two options fill a 40 px control, 240 px each, with 14 px marks. The
  `data-figma` box is the field's width, so the check sees only the x
  and height. Codex site is selected, as Figma's. Library gap "Segmented
  control full width".
- **Project.** The project is a button with the folder, "ncc-1701" and a
  chevron at the end, which opens a menu of the projects (`RadioMenu`):
  its fill is the raised button fill, not the input's inset fill, and the
  project is in the label font, not mono. Library gap "Select field".
- **Buttons.** `button · Cancel` x -20.9, y -10, w -4.4 and
  `button · Add artifact` x -25.3, y -10: they follow the dialog 32 px
  left and the dialog's 20 px padding (Figma 24), so they sit 10 px
  higher; Cancel is `Button`'s 71.6 px against 76. Library gaps "Dialog
  placement" and "Dialog form padding".
- **Link focus.** The link field has the focus when the dialog opens,
  with the cyan border, as Figma draws it. The dialog's focus trap selects
  the field's text when it focuses it; the dialog puts the caret after
  the link instead, so the link shows unselected. The link field is a
  text field, not `type="url"`, because a `url` input has no caret API.

## Deviations: the library behind it (as D01)

- **Search, Sort and Filter.** `search` w -17.4, `button · Sort` x -17.4,
  w +8.4, `button · Filter` x -9, w +4.4, as D01: Sort and Filter pad
  their sides more than Figma's 11 px, and the search and the space
  before the view switch share the free width equally where Figma gives
  the search 22 px more. Library gap "Sort and Filter button widths".
- **Source chips.** `filter · chips` w +7.2: the chips are 6 apart with
  8 px sides against Figma's 5 and 9. Library gap "Compact chip spacing".
- **Cards.** `artifact card · Skill eval pass rates`,
  `artifact card · Hono server spike`, `artifact card · Inbox task lifecycle`,
  `artifact card · Tailscale access check`,
  `artifact card · the-bridge theme ideas`,
  `artifact card · Application versioning and releases`,
  `artifact card · Panda tokens playground`,
  `artifact card · Agent factory and session tracking`,
  `artifact card · Brain map prototype`,
  `artifact card · Type safety in agentic systems`,
  `artifact card · Logo options` and
  `artifact card · readme cold-reader run` are each h -5.2 (280.8 high
  against 286), as D01's: `Card` pads 16 at the sides, keeps 16 px lines
  and draws a 186.75 px thumbnail. New sits 8 px after the title, not at
  the end of the row, and the kind marks are 12 px against 14. Library
  gaps "Card body and line heights", "Card badge at the end of the title
  row" and "Card kind mark size".
- **Thumbnail colours.** The readme cold-reader chart is cyan and violet,
  not amber, and the Agent factory doc's bar is not green. Library gap
  "Thumbnail colour".
- **Page title.** "Artifacts" is 20 px type against Figma's about 24 px.
  Library gap "Desktop page title size".
- **Rail.** The shared rail (`AppRail`, not changed here: another chat
  holds the navigation) has a Toolkit item after Artifacts (d-105), which
  this frame does not draw, so More sits one item lower. Its items are
  50 high and 56 apart, as Figma's (library #115).
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.
## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the library's part until it lands: the
dialog padding 24 (Figma's, spacing `24`; drawn 20), the field label
`label` (Medium 14/20) in `fg.default` (Figma's; drawn `small` in
`fg.muted`), a 40 px input and a 40 px segmented control (Figma's, on the
4 px grid; drawn 44 and 36), the input's leading icon at `icon.16`
(Figma's 14 on the 4 px grid) and the link and project in `mono`. The
dialog is `Dialog size="lg"`, 540 wide (`shell.dialogLg`, Figma's 540),
its fields 16 apart (Figma's, the dialog's gap), and the helper lines
`small` in `fg.muted`, 6 under the control, as `TextField`'s.
