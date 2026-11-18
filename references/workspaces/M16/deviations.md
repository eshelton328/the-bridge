# M16 deviations

What still differs from Figma M16 · Tap a chat to open it (M1's list at
the moment Erik taps bridge themes, `phoneTapChat`), after the last
fidelity run (`pnpm fidelity workspaces M16`, 2026-11-18, library
1.0.0-beta.30), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M1's
`PhoneWorkspaceList` with M16's layers; a tap on a chat opens it full
screen (M3, `PhoneChat`), with no tab bar, no drag and no split panes
(`WorkspacesPhoneTapChat.test.tsx`).

## Checks

- Text: pass. Every Figma string shows; no extra text.
- Position: fail, 20 of 28 layers pass. 8 layers are off by more than
  4 px:
  - `402:10630` (hono server) and `402:10644` (its ⋯): y -6.
  - `402:10649` (dev server) and `402:10660` (its ⋯): y -6.
  - `402:10665` (OMNI header): y -6.
  - `402:10675` (release notes) and `402:10691` (its ⋯): y -8.
  - `402:10696` (SKILL-EVALS header): y -8.
- Rules: pass.

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

## Deviations

- **No tap ring over bridge themes.** Figma draws a grey ring, 48 px
  across, over the start of bridge themes' name (`tap`, 402:10747). It
  marks where the finger lands, for the reader of the frame, as the
  note says what the tap does. The app draws no touch marker, so the
  render shows the row as M1 does: selected, with no ring. The ring has
  no `data-figma` and no text, so no check measures it.
- **Lower workspaces start higher (Sidebar group header), `402:10630`,
  `402:10644`, `402:10649`, `402:10660`, `402:10665`, `402:10675`,
  `402:10691` and `402:10696` y -6 to -8.** As in M01: `GroupHeader
  variant="sidebar"` is 30 high against Figma's 28 and its rows start
  right under it, where Figma leaves 4, so each workspace after the first
  starts 2 px higher than the one above.
- **Group header icons (Sidebar group header).** As in M01, the chevrons
  and the header's ⋯ are 12 px library icons against Figma's 13 and 14
  px; they look thinner and smaller.
- **The row ⋯ is lighter (Phone chat row).** As in M01, the 20 px thin
  `MoreIcon` in `fg.muted` against Figma's heavy 18 px dots, on every
  row.
- **The nested row starts further left (Phone chat row).** As in M01:
  `ListRow level={1}` pads 24 where Figma pads 44, so theme tokens' ↳,
  mark and title sit 14 to 19 px left of Figma's.
- **Header (Phone page header).** As in M01, `PageHeader size="phone"`
  is 40 high against Figma's 44; the header pads 4 under it.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="phone"`
  draws the Inbox phone frame's stars at fixed places, not M16's.
- **Status bar and home indicator.** The app draws none (d-089), so the
  side-by-side shows a blank band at the top.
- **Square corners.** Figma's rounded corners are the phone's device
  frame, not the screen; the app draws none, as in the other phone
  frames.
