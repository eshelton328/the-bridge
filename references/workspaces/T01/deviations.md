# T01 deviations

What still differs from Figma T1 · Workspaces (edit mode) (the list in
edit mode on the iPad mini, `tabletEdit`), after the last fidelity run
(`pnpm fidelity workspaces`, 2026-11-18, library 1.0.0-beta.36), each
with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M2's list
(`PhoneWorkspaceList` in edit mode) at the tablet's width: the state's
`tabletList` makes `WorkspacesScreen` draw `WorkspacesPhone
device="tablet"`, with the tablet's backdrop, shell, Container and tab
bar.

## Checks

- Text: fails on one extra string, `Artifacts` (the tablet tab bar's
  Artifacts tab). Every Figma string shows, the field value
  "the-bridge" and both Done strings included.
- Position: 13 of 23 layers pass: the list (`105:1517`), the header
  (`105:1518`), + (`105:1525`), Done (`105:1523`), omni-brain's header
  (`105:1531`), the six chat rows (`105:1550`, `105:1574`, `105:1604`,
  `105:1642`, `105:1663`, `105:1697`) and the `tab bar`.
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `105:1594` (Move to…): x -8.7, w +5.7.
- `105:1622` (the-bridge's header): y +5.
- `105:1681` (omni's header): y +6.
- `105:1720` (skill-evals' header): y +5.
- `tab · Home`: w -15.2.
- `tab · Inbox`: x -15.2, w -15.2.
- `tab · Workspaces`: x -30.4, w -15.2.
- `tab · Projects`: x -45.6, w -15.2.
- `tab · More`: x +15.2, w -15.2.
- `tab · Artifacts`: no layer in the frame.

## Deviations

- **Six tabs, not five (Tablet tab bar).** Figma draws the phone's five
  tabs, 91 wide each and centred (255:2); the note says the iPad mini
  uses the phone's tab bar for now. The app has one tab bar for every
  page (d-105): `AppTabBar device="tablet"` adds Artifacts before More,
  and `TabBar size="tablet"` draws each tab 76 wide. So the render shows
  `Artifacts` (the extra text) and each of Figma's tabs sits 15 to 46 px
  from Figma's place (`tab · Home` to `tab · More`, `tab · Artifacts`).
  `AppTabBar` is a shared block that this frame may not change. No
  exception: the Inbox's tablet frames accept the same Artifacts tab
  with one, but this build adds none, so the text check fails on it.
- **Lower headers sit 5 to 6 px low (Phone chat row, Sidebar group
  header).** Each chat row is 52 high against Figma's 50, and each group
  header 30 against 29 (the 4 px grid, d-072, d-100). M2 has the same
  rows but its renamed chat row (58, as Figma) holds the drift under
  4 px; in T1 bridge themes is a plain row, so the-bridge's header
  (`105:1622`) is 5 px low, omni's (`105:1681`) 6 and skill-evals'
  (`105:1720`) 5. The rows under them pass.
- **Move to… is 6 px wider (Move to button).** Figma's button is 85 ×
  22 with a 12 px mark and 12 px label; `Button size="xs" textSize="xs"`
  is 24 high and draws its icon at 16, so it is 91 wide. It ends at the
  row's trailing edge, 3 px before Figma's, as the tablet Container pads
  24 against Figma's 22 (`105:1594` x -8.7, w +5.7).
- **Side inset (Phone chat row).** `Container size="tablet"` pads 24
  against Figma's 22, so every full-width layer is x +2, w -4 (within
  the tolerance). The header pads 2 at its end and the-bridge's header
  4, so + and the field end where Figma's do.
- **The-bridge's field (Rename field).** As in M2: the field is 28 high
  against 25, its text 14 px against 13, its × 16 px and 6 px further in;
  the screenshot shows no caret, as the caret only blinks in a live
  browser (105:1634).
- **Done's label is 14 px (Phone page header).** `Button variant="primary"
  size="sm"` draws `label` against Figma's 13 px, so Done is 2 px wider;
  the header is `PageHeader size="phone"`, as on the phone.
- **Grips and × are smaller (Sidebar group header, Phone chat row).**
  Figma's handles are 14 px and its × 15 px, both heavy; the icon set
  draws 12 px `GripIcon` and `CloseIcon` with a thin stroke.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws its own stars at fixed places, not this frame's 58.
- **Status bar and home indicator.** Figma draws a 29 px status bar
  (9:41) and the home indicator; the app draws none (d-089), so the
  side-by-side shows a blank band at the top.
- **Actions.** The handles draw only: dragging a workspace (R7) or a
  chat onto another workspace (R8) is a later frame. Move to… opens
  drift check's actions (M9's sheet) with Move to workspace's list open,
  as the drag's alternative; Figma does not show what it opens.
- **Data as Figma draws it.** theme tokens is not listed, and drift check
  shows Move to… in place of its status (`hideStatus`, `phone.moveTo`).
- **No exceptions.**
