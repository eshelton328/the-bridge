# D01 deviations

What still differs from Figma after moving the Workbench onto the library's
1.0.0-beta.16, measured on 1.0.0-beta.61 (`pnpm fidelity workspaces`,
2026-11-18), each with its reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.

## Checks

- Text: pass. `Read f-005-the-bridge/requirements.md` (105:214) is
  clear of the skill list, as in Figma (see Skill list below). The pane
  menu covers only the end of the first message's
  bubble, as in Figma, where the menu lies over the same text layer. The
  context percentages pass without an exception: `ContextMeter` draws
  each as one text node. Artifacts and Toolkit on the rail are excepted
  as on the Inbox frames (d-105).
- Position: 12 of 23 layers pass (`nav rail`, `158:2`, `105:177`,
  `105:210`, `105:316`, `105:262`, `105:304`, `105:347`, `105:421`);
  `150:2`, `105:215`, `105:230`, `105:337`, `105:291`, `105:370`,
  `105:384` and `105:406` (its width only, R8) fail. Move to workspace's list (105:473) and
  the empty pane's list (105:368) are not measured, as their library
  parts take no `data-figma` (Submenu data attributes, Empty pane rows);
  the list's two rows (105:370, 105:384) are.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass. The three skill descriptions that the 160 px list cut
  fit in the wider list (see Skill list below).

## Deviations

- **Text sizes (Workbench status bar text, Pane header text, Message
  text).** Figma draws the status bar in Geist Mono 11, a pane header's
  title in SemiBold 13 with its model and context in Geist Mono 11, Erik's
  message in 13/19 and an agent's name in SemiBold 12 (D08 402:1033,
  402:1042, 402:1066, 402:1072). The library's `Workbench` status bar
  draws `mono` (12), `Pane` draws `label` (14/500) and `mono` (12), and
  `Message` draws `body` (14/20) and `label` (14/500); none takes a text
  size, so each is about one size larger than Figma's (fidelity review D08
  F1, F2, F4).
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
  bare, but draws `border.active` while the menu is open, where Figma
  draws no border: the border rule (2026-11-18) gives every trigger of an
  open menu, popover or sheet that border.
- **Move to workspace list (Submenu data attributes).** The list is the
  move action's `submenu`: 200 wide, to the right of the row at its top,
  with the-bridge highlighted, as in Figma. Its box takes no
  `data-figma`, so the position check does not measure it.
- **Skill list width (Skill picker, 2026-11-18), `105:406` w +113.2.**
  Known difference (D1). The popover is `width="composer"`: 40% of the
  pane's 683 px composer, 273.2 wide, where Figma draws 160 (it was
  `width="xs"`, 160). Reason: Erik's comment of 2026-11-18 in the-bridge-review.md (R8): the skill list grows with the composer. In a pane the list is 40% of
  the composer, from 240 to 400 (`shell.pickerMin`, `shell.pickerMax`).
  The text column is about 233 px, so the three descriptions that the
  118 px column cut (Draft a doc from sources 136, Write or check a
  README 141, Write a PR description 121) now show whole: the text
  check finds them and the rules check has no `hiddenOverflow`.
- **Skill list (Skill picker).** `105:406` passes its y and height: its
  rows show each /name in mono, the highlighted /writer filled with no
  check (`OptionList labelStyle="mono" check={false}`), as in Figma, each
  name and description on one line (library #171). The popover and the
  list are `density="compact"`, as on the tablet and the phone: 7 from the
  box's edge to the 20 px SKILLS row (Figma 21) and 44 px rows 2 apart,
  as Figma's (105:407, 105:412, 105:415, 105:418), so the box is 172 high
  against 173, its top at y 189 against 191.5, and the Read
  f-005-the-bridge/requirements.md line (105:214) stays clear of it. The
  SKILLS label has no rule after it.
- **Shell pane.** `105:337` h -5: the terminal ends 5 px higher than
  Figma's. `TerminalLines` draws the lines in mono in the git colours
  and the block cursor after the prompt "$", as Figma does; the
  `ScrollFrame` around it takes the keyboard focus.
- **Empty pane (Empty pane rows).** `EmptyPane` draws the dashed box,
  the title, the line, the start buttons and the OPEN IN THIS PANE list.
  `105:370` y -5.5, h +6 and `105:384` h +6: the rows are
  `ListRow density="compact"` (Figma's 13 px title and mono meta), 56 px
  against Figma's 50. The start buttons are 28 px (`size="sm"`, Figma
  30) with 16 px kind marks (`KindMark size="16"`, Figma 14). A context
  of 75 or more draws the meter in amber, as Figma draws 78% (the limit
  is a pick by d-100).
- **Sticky composer (d-107).** Only the transcript of each chat pane
  scrolls; the pane header and the composer stay in view. The frame
  shows the top of the scroll, so this changes no pixel here.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
