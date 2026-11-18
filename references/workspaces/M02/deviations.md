# M02 deviations

What still differs from Figma M2 · Edit workspaces (the phone's list in
edit mode, `phoneEdit`), after the last fidelity run (`pnpm fidelity
workspaces M02`, 2026-11-17, library 1.0.0-beta.27), each with its reason.
The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is M1's list (`PhoneWorkspaceList`) with `ui.editing`: each
workspace is a `PhoneEditGroup`, Done takes Edit's place and + is off.

## Checks

- Text: pass. Every Figma string shows, the two field values ("theme
  explorations", "the-bridge") and both Done strings included; no extra
  text.
- Position: pass, 22 of 22 layers: the list (`105:2504`), the header
  (`105:2505`), Done (`105:2508`), + (`105:2510`), the four workspace
  headers, the six chat rows, the two fields (`146:37`, `105:2614`), the
  tab bar and its five tabs (`tab · Home` to `tab · More`).
- Rules: pass.

## Deviations

All checks pass; these differences show in the side-by-side only.

- **Only one field has the focus (Rename field).** Figma draws both
  fields, bridge themes' and the-bridge's, with the cyan border, the dark
  fill and a caret. Only one element can have the focus, and a second
  field that took it would blur the first, which saves and closes it; so
  the first chat field takes the focus and the-bridge's field draws
  `SearchField`'s resting look: a grey border on the lighter
  `surface.inset` fill, with no caret.
- **Fields are 28 high (Rename field).** Figma's fields are 25 high
  (146:37, 105:2614); `SearchField size="sm"` is `control.sm`, 28 (the
  4 px grid). The chat row pads 8 above the field and 4 under the meta
  line, so it keeps Figma's 58; the workspace header is 40 high against
  39. The field's text is 14 px (`body`) and its × 16 px, against Figma's
  13 px text and 15 px ×. `SearchField` pads its clear button, so each
  field's × is centred 6 px further in than Figma's (347 and 351 against
  353.5 and 357.5; 187:2, 105:2619) and the library takes no padding for
  it. The × on a workspace header is centred where Figma's is (105:2530,
  x 364).
- **No caret (Rename field).** Figma draws the caret after "theme
  explorations" (146:39) and after "the-bridge" (105:2616). The field has
  the focus (its cyan border), but the fidelity screenshot shows no caret,
  as the caret only blinks in a live browser (as in D21).
- **Grips and × are smaller (Sidebar group header, Phone chat row).**
  Figma's drag handles are 14 px and its × 15 px, both heavy. The icon
  set has 12 and 16 px sizes and draws a thin stroke, so the handles and
  × are 12 px `GripIcon` and `CloseIcon` and look smaller and lighter.
- **Group headers are 30 high (Sidebar group header).** Figma's are 29;
  the lower headers and rows sit 1 to 3 px from Figma's, within the
  tolerance.
- **Done's label is 14 px (Phone page header).** `Button variant="primary"
  size="sm"` draws `label` (14/20) against Figma's 13 px; the button is
  2 px wider. The header is `PageHeader size="phone"`, 40 high against
  44, padded 4 under it, as in M01.
- **The chevron of the renamed workspace is a bare button.** Figma draws
  the chevron (105:2612) bare; a `Button` with `aria-expanded` draws the
  expanded border (Bare menu trigger), so the chevron's button names what
  a tap does ("Hide the chats of the-bridge") in place of `aria-expanded`.
- **The stars sit elsewhere (Backdrop stars).** Figma draws the frame's
  own 22 stars behind the screen (the 22 `star` layers that `frame.json`
  skips); `Backdrop size="phone"` draws the Inbox phone frame's 22 stars
  (346:8982) at fixed places and takes no positions, so the render's
  dots have Figma's count and tone but sit in other places; one falls
  next to SKILL-EVALS' count.
- **Status bar and home indicator.** Figma draws a 38 px status bar
  (9:41), the home indicator and the frame's rounded corners; the app
  draws none (d-089), so the side-by-side shows a blank band at the top.
- **Actions still to build.** The handles draw only: dragging a workspace
  to reorder it (R7) or a chat onto another workspace (R8) is a later
  frame. × on a workspace header draws only (closing a workspace, R6).
  A tap on a workspace's name toggles its chats, as in M1; only a chat's
  name opens its field on a tap (`PhoneEditGroup` opens a workspace's
  field from `ui.renamingWorkspaces`). A tap outside a field saves the
  name (`ui.names`, `ui.workspaceNames`), its × undoes the change, and
  Done ends edit mode and closes the fields.
- **Data as Figma draws it.** theme tokens is not listed and drift check
  shows no status (`hideStatus`), as in Figma's frame.
- **No exceptions.**
