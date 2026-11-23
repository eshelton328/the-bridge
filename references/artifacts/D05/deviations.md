# D05 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D05`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. The library behind the dialog
is D01's, so its deviations are D01's.

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.
Checked again 2026-11-19 with library 1.0.0-beta.69 (card `tone`,
compact Sort and Filter): the text, position and rules results did not
change.

Checked again 2026-11-19 with library 1.0.0-beta.89 (`pnpm fidelity
artifacts D05`, round 2): the dialog now uses the library's form parts
(`Dialog padding="form"`, `TextField size="form"`, `ViewSwitch
fullWidth`, `SelectField`), so the fields are Figma's 490 wide. Text and
rules pass; position fails on the layers below.

## Checks

- Text: passes, as D01: the view switch draws its icons alone
  (`ViewSwitch iconOnly`, library #121). Every string is visible.
  `Toolkit` is an `extra` exception, and the four card descriptions that
  Figma cuts with an ellipsis are `missing` exceptions (`exceptions.json`),
  as D01's.
- Position: 11 of 37 layers pass (`rail · Inbox`, `rail · Workspaces`,
  `rail · Projects`, `rail · Artifacts`, `header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · FOUND SINCE YOU LAST LOOKED`, `group · EARLIER`). Twenty-six
  fail; each is listed below.
- Rules: pass. The library's scrolling pane and the four cut descriptions
  are `hiddenOverflow` exceptions, as D01's. The two `scrollBar`
  exceptions of the link and title inputs are gone: with `TextField
  padding="form"` the check finds no `scrollBar` on them.

## Deviations: the dialog

- **Dialog placement.** `dialog · Add a link` x -32, y +5, h -11.
  Figma centres the dialog over the library, right of the rail (x 518);
  `Dialog` centres it in the window (x 486), 32 px further left. Every
  part of the dialog follows it: `field · Link` x -32, y +6,
  `field · Title` x -32, `field · Source` x -32, `segmented · Source`
  x -32, `field · Project` x -32. Library gap "Dialog placement".
- **Source and Project height.** `field · Source` h -5 and
  `segmented · Source` y +5, `field · Project` h -5: the Source switch
  (`ViewSwitch fullWidth size="lg"`) and the Project select (`SelectField
  size="lg"`) are 36 high against Figma's 40; neither has the 40 px
  `form` size that `TextField` has. So the dialog is 11 px shorter.
  Library gap "Form control height 40".
- **Buttons.** `button · Cancel` x -24.9, y -10, w -4.4 and
  `button · Add artifact` x -29.3, y -10: they follow the dialog 32 px
  left and its 11 px shorter body, so they sit 10 px higher; Cancel is
  `Button`'s 71.6 px against 76. Library gaps "Dialog placement" and
  "Form control height 40".
- **Mono values.** The link and the project are in `mono` (12/16), so
  they are smaller than Figma's mono text in a 20 px line (403:7553,
  403:7581). Library gap "Mono field value size".
- **Icons.** The link icon, the folder, the chevron and the Claude and
  Codex marks are 16 px against Figma's 14 (14 is off the 4 px icon
  scale; d-100). The close × is 20 px (`closeSize="20"`) against 18.
- **Project label.** `SelectField` draws its label only in `small`, so
  its own label is hidden (`labelHidden`, still the field's name) and
  the Project label shows in `label` (Medium 14/20) in `fg.default`, as
  the other labels. Library gap "Select field label style".
- **Project menu.** Not in the frame: the project menu opens under the
  dialog, so a pointer cannot pick a project; the keyboard can. Library
  gap "Menu inside a dialog".
- **Link focus.** The link field has the focus when the dialog opens,
  with the cyan border, as Figma draws it. The dialog's focus trap selects
  the field's text when it focuses it; the dialog puts the caret after
  the link instead, so the link shows unselected. The link field is a
  text field, not `type="url"`, because a `url` input has no caret API.

## Deviations: the library behind it (as D01)

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:958); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:958 (2026-11-19, the same decision on every page's rail).
- **Search, Sort and Filter.** `search` w -11.4, `button · Sort` x -11.4,
  `button · Filter` x -11, as D01: Sort (108.4) and Filter (75.4) take
  `padding="compact"` and are Figma's widths, but the search and the
  space before the view switch share the free width equally where Figma
  gives the search 22 px more, so the search is 554.1 wide against 565.5.
  Library gap "Sort and Filter button widths".
- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
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
  and draws a 186.75 px thumbnail. Library gap "Card body and line
  heights".
- **Card kind mark (2026-11-18).** Library beta.51 (#168) draws the
  leading mark of `MetaLine icon="md"` at 16 px, so the Claude and Codex
  marks in the meta line are 16 px against Figma's 14 (d-100: 14 ties
  12 and 16 on the 4 px icon scale, and the tie takes 16). They were 12.
- **Thumbnail colours.** The readme cold-reader chart is amber
  (403:7509) and the Agent factory doc's title bar green, as Figma's
  (`Thumbnail tone`, library 1.0.0-beta.68); the chart bars are still a
  brighter cyan than Figma's muted teal-cyan. Library gap "Thumbnail
  colour".
- **Rail.** The shared rail (`AppRail`, not changed here: another chat
  holds the navigation) has a Toolkit item after Artifacts (d-105), which
  this frame does not draw, so More sits one item lower. Its items are
  50 high and 56 apart, as Figma's (library #115).
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.
## Values picked (d-100)

Library 1.0.0-beta.89 draws the dialog's padding (24), its 40 px text
fields padded 12, their `label` labels, the link icon at `icon.16` and
the mono values. Still drawn with the nearest library part: the 40 px
Source switch and Project select (drawn 36, "Form control height 40")
and the mono value size ("Mono field value size"). The dialog is
`Dialog size="lg"`, 540 wide (`shell.dialogLg`, Figma's 540), its fields
16 apart (Figma's, the dialog's gap), and the helper lines `small` in
`fg.muted`, 6 under the control, as `TextField`'s.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it.
