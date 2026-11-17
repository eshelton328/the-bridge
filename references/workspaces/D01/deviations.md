# D01 deviations

What still differs from Figma after the first build of the Workbench
(`pnpm fidelity workspaces D01`, 2026-11-17, round 3, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`.

## Checks

- Text: pass. The four context percentages (`42%`, `23%`, `78%`, `64%`) are
  in `exceptions.json`: `ContextMeter` draws the number and "%" as two text
  nodes, and the render shows each one. Artifacts and Toolkit on the rail
  are excepted as on the Inbox frames (d-105).
- Position: 3 of 17 layers pass (`nav rail`, `150:2`, `105:304`).
- Rules: pass.

## Deviations

- **Tab bar height (Workbench tab bar).** The library's bar is 16 px
  taller than Figma's 52: 32 px tabs (`control.md`, Figma 30), 2 px list
  padding above and below the tabs, and 10 px padding above the panes
  where Figma has none. Every pane starts 16 px lower and is 9 px shorter:
  `105:177` y +16, h -9; `105:262` y +16, h -9; `105:316` y +7, h -9;
  `105:347` y +7, h -9. The layers inside move with them: `105:210` y
  +19.5, `105:215` y +20.5, h +8 (the reply wraps in body text, 14/20, and
  Copy is 24 px, `Button size="xs"`, Figma 22), `105:291` y +20, h +6
  (`ProposalBlock` padding and its 28 px buttons), `105:337` y +11, h -13,
  `105:421` y +15, h +12 (the pane menu opens 4 px below its trigger, and
  its rows are 32 px, Figma 31).
- **Composer.** `105:230` h +7: the attachment chip, the 20 px text line
  and the 28 px buttons of `Composer` are taller than Figma's 22, 17 and
  26. Figma draws the composer focused with a caret after "/"; the story
  does not focus it, as the open menu holds the focus.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Sidebar toggle (Sidebar toggle).** `158:2` x +533.7: the toggle sits
  after New chat, at the end of the tabs, because `Workbench` has no slot
  before the tabs. It is 28 px (`Button size="sm"`) against Figma's 30.
- **Move to workspace list (Submenu).** `105:473` x -40.5, y +43, w +40,
  h +8: `Menu` has no submenu, so the list is a second `Menu` that opens
  below the row's chevron, not beside the row, and its box is at least
  240 wide (Figma 200). The pane menu is drawn over the list's left edge,
  so the icons of the-bridge and omni are hidden under it.
- **Highlighted rows (Menu highlighted row).** Figma fills Move to
  workspace and the-bridge; `Menu` fills only the row under the pointer
  or focus, so no row is filled.
- **Skill list (Skill picker).** `105:406` y -24.5, w +80, h +29: the
  popover is 240 wide (`width="sm"`, the narrowest; Figma 160), so it
  covers more of the reply. The names are in `labelSm` (sans), not mono,
  and the chosen /writer has a check that Figma does not draw. The SKILLS
  label has no rule after it. The list opens 4 px above the composer, not
  10.
- **Shell pane (Terminal output).** The lines are mono text in the status
  colours (amber, red, green), as Figma's; there is no block cursor after
  the prompt "$". The terminal takes the keyboard focus (`role="log"`).
- **Empty pane.** `105:368` y -10.5, h +27: the OPEN IN THIS PANE rows are
  `ListRow`s, 56 px against Figma's 50, so the list is taller and the
  centred block starts higher. The start buttons are 28 px (`size="sm"`,
  Figma 30) with 16 px kind marks (`KindMark size="16"`, Figma 14). The
  title is `paneTitle` and the line `bodySm`; the dashed outline is
  `border.default` (d-100: Figma's colour has no other token). The list is
  380 wide through `shell.popoverPicker` (380, Figma's value, reused by
  d-100). A context of 75 or more draws the meter in amber, as Figma
  draws 78% (the limit is a pick by d-100).
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
