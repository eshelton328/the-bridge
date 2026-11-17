# D01 deviations

What still differs from Figma after moving the Workbench onto the library's
1.0.0-beta.15 (`pnpm fidelity workspaces`, 2026-11-17), each with its
reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.

## Checks

- Text: fails on one string. `Read f-005-the-bridge/requirements.md`
  (105:214) is `covered`: the skill list lies over it (see Skill list
  below). The pane menu covers only the end of the first message's
  bubble, as in Figma, where the menu lies over the same text layer. The
  context percentages pass without an exception: `ContextMeter` draws
  each as one text node. Artifacts and Toolkit on the rail are excepted
  as on the Inbox frames (d-105).
- Position: 9 of 16 layers pass (`nav rail`, `158:2`, `105:177`,
  `105:210`, `105:316`, `105:262`, `105:304`, `105:347`, `105:421`);
  `150:2`, `105:215`, `105:230`, `105:337`, `105:291`, `105:368` and
  `105:406` fail. Move to workspace's list (105:473) is no longer
  measured (Submenu data attributes).
- Rules: pass.

## Deviations

- **Tabs (Workbench tab bar).** The bar is 52 px (`Workbench
  size="compact"`) and the panes start right under it, as in Figma, with
  the sidebar toggle before the tabs (`leading`, 28 px against Figma's
  30). The four tabs are 35 px wider than Figma's together, so New chat
  (`150:2`) sits x +34.7.
- **Panes.** `105:215` y +4.5, h +8: the reply wraps in body text
  (14/20), and Copy is 24 px (`Button size="xs"`, Figma 22). `105:291`
  h +6: `ProposalBlock` padding and its 28 px buttons. `105:337` h -5:
  the terminal ends 5 px higher than Figma's.
- **Composer.** `105:230` y -7.5, h +7: the attachment chip, the 20 px text line
  and the 28 px buttons of `Composer` are taller than Figma's 22, 17 and
  26. Figma draws the composer focused with a caret after "/"; the story
  does not focus it, as the open menu holds the focus.
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Pane menu (Menu icon size, Bare menu trigger).** The menu (`105:421`)
  passes: `density="compact"` puts its rows edge to edge, and the state
  highlights Move to workspace (`highlightedValue`), with its icon in the
  accent colour. Its icons are 16 px (Figma 14). The ⋯ that opens it is
  bare, as in Figma; a class keeps the button's expanded border
  transparent, because every `Button` variant draws it.
- **Move to workspace list (Submenu data attributes).** The list is the
  move action's `submenu`: 200 wide, to the right of the row at its top,
  with the-bridge highlighted, as in Figma. Its box takes no
  `data-figma`, so the position check does not measure it.
- **Skill list (Skill picker).** `105:406` y -32.5, w +80, h +29: the
  popover is 240 wide (`width="sm"`, the narrowest; Figma 160), and its
  `OptionList` rows are 50 px against Figma's 44, so the box is 202 high
  against 173. It opens 4 px above the composer (Figma 10), which is
  7 px taller than Figma's, so its top is at y 159 and covers the Read
  f-005-the-bridge/requirements.md line (Figma y 151.5 to 167.5, clear of
  the list). No library prop makes the rows or the box smaller, so the
  line stays covered. The names are in `labelSm` (sans), not mono, the
  chosen /writer has a check that Figma does not draw, and the SKILLS
  label has no rule after it.
- **Shell pane (Terminal output).** The lines are mono text in the status
  colours (amber, red, green), as Figma's; there is no block cursor after
  the prompt "$". The terminal takes the keyboard focus (`role="log"`).
- **Empty pane.** `105:368` y -14.5, h +27: the OPEN IN THIS PANE rows are
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
