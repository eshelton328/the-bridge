# M13 deviations

What still differs from Figma M13 · Confirm closing a workspace (the
dialog that × on a workspace in the phone's edit mode opens,
`phoneCloseWorkspace`), after the last fidelity run (`pnpm fidelity
workspaces M13`, 2026-11-18, library 1.0.0-beta.30), each with its
reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is M2's list in edit mode (`PhoneWorkspaceList` with
`ui.editing`, no field open) with `CloseWorkspaceDialog` over it
(`ui.closing: 'omni-brain'`).

## Checks

- Text: pass. Every Figma string shows, the title, the text, Cancel and
  Close included; no extra text.
- Position: fail, 10 layers off by more than 4 px:
  - `208:610` (drift check) y -7, `208:630` (brain git) y -5,
    `208:665` (hono server) y -11, `208:686` (dev server) y -9,
    `208:704` (OMNI header) y -7, `208:720` (release notes) y -10,
    `208:743` (SKILL-EVALS header) y -8: the list's rows sit higher than
    Figma's (see "List rows sit higher").
  - `208:765` (confirm dialog) x -24, y +18, w +48; `208:769` (Cancel)
    x -24, y +20, w +25; `208:771` (Close) y +20, w +25: the dialog is
    wider and lower (see "The dialog is wider" and "The dialog is
    lower").
- Rules: pass.

## Deviations

- **The dialog is wider (Phone confirm dialog).** Figma's dialog is 310
  wide, 40 in from each side. `Dialog size="md"` is `shell.dialog` (440)
  wide, capped by its positioner's 16 px padding, so on the phone it is
  358 wide (16 to 374) and each button is 154 wide against 129. No
  `Dialog` size fits a phone and no width token is 310. The text still
  wraps to three lines, at "and" where Figma wraps at "drift check".
- **The dialog is lower (status bar, d-102).** Figma centres the dialog
  in the whole 844 px frame (y 326). The app draws no status bar
  (d-089), so the render is 806 high and the library centres the dialog
  in that, 19 px lower once the position check adds the bar's 38 px
  back (y 344).
- **Button labels and Close's fill (Phone confirm dialog).** Figma sets
  Cancel and Close in SemiBold 15 and fills Close dark red (about
  #3a1420) inside a bright red border. `Button size="xl"` draws `label`
  (Medium 14), and `variant="dangerSoft"` fills with `status.danger.bg`,
  a greyer red, so Close looks duller than Figma's.
- **No focus ring on Cancel.** Figma draws neither button focused. The
  dialog's box takes the focus as it opens (as `ForkDialog` does), so no
  button shows a ring and Enter closes nothing; Tab reaches Cancel.
- **List rows sit higher (Phone chat row, Sidebar group header).** Figma
  keeps two parts of M2's open fields: bridge themes' row is 56 high
  (208:586) with its kind mark at x 42 and its name at 64, and
  THE-BRIDGE's header is 34 high (208:648) with no count and no dot.
  No field is open in M13, so the render draws both as M2's plain rows:
  bridge themes is a 52 px row with its mark and name where the other
  rows have them (x 46 and 72), and THE-BRIDGE's header is 30 high with
  its count (2) and the needs-you dot, as the data has them. Each row
  is 52 against Figma's 50 and each header 30 against 29 (the library's
  `ListRow` and `GroupHeader`, the 4 px grid), so the drift grows down
  the list, to 11 px at hono server.
- **Grips and × are smaller (Sidebar group header, Phone chat row).** As
  in M02: the icon set has 12 and 16 px sizes, so the 14 px handles and
  15 px × are 12 px and thinner.
- **Done's label is 14 px (Phone page header).** As in M02:
  `Button variant="primary" size="sm"` draws `label` (14/20) against
  Figma's 13 px.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's 22 stars at fixed places, not M13's.
- **Status bar and home indicator.** The app draws none (d-089), so the
  side-by-side shows a blank band at the top.
- **Data as Figma draws it.** bridge themes and drift check show no
  status (`hideStatus`) and theme tokens is not listed, as in Figma's
  frame. Close takes the workspace off the list (`ui.closedWorkspaces`);
  closing its chats is later work. Close workspace in a chat's actions
  (M14) is a later frame.
