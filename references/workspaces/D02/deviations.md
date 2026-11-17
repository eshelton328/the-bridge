# D02 deviations

What still differs from Figma after the first build of Workspaces and side
chat (`pnpm fidelity workspaces`, 2026-11-17, against the library's
1.0.0-beta.15), each with its reason. The library gaps are
in `web/src/pages/workspaces/LIBRARY_GAPS.md`.

## Checks

- Text: fails on two percentages and two rail labels.
  - `78%` (105:715) and `23%` (105:972): both metas are cut in the render
    (see `hiddenOverflow` below). The other percentages (`42%`, `23%`,
    `18%`, `26%`) pass: `ContextMeter` draws each as one text node.
  - `Artifacts` and `Toolkit` (extra): the shared `AppRail` adds them before
    More (d-105), as on D01, where they are excepted. D02 has no
    `exceptions.json`.
- Position: 22 of 28 layers pass; `105:960`, `105:976`, `105:874`,
  `105:889`, `105:933` and `105:935` fail.
- Rules: `hiddenOverflow` on two row meta lines (hono server 105:705 and
  the dragged row 105:960).

## Deviations

- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 105:705: the hono server row's meta ("Sonnet 5.5" and "78%") is
  152 px in a 150 px column beside its `Needs you` pill, so the end of
  "78%" is cut 2 px. The rows are `ListRow density="compact"`, 50 px as in
  Figma.
- **Dragged chat (Drag preview).** `105:960` w -26.3, h -15.1: Figma
  turns the dragged row about 3° and lets it pass the sidebar's right
  edge; the library has no rotate token and the sidebar's scrolling body
  clips what passes its edge, so the row is not turned and ends at the
  rows' end (268 wide). Its meta is 132 px in 110, so "23%" is cut off
  (`hiddenOverflow`). The offsets from the group header are spacing tokens
  (d-100: Figma's pointer place, 40 in and 46 down, has no token).
- **Drop hint (Drag preview).** `105:976` w -7.1: the hint is a
  `Badge tone="working"` (cyan text on a cyan tint) on the overlay fill,
  without Figma's cyan border, and its padding is 8 where Figma's is about
  11.
- **Drop target (Sidebar group header).** The-bridge's header has the
  dashed cyan outline on the selected fill, drawn with `css()` around
  `GroupHeader`, which has no drop-target look.
- **Group header icons (Sidebar group header).** The ⋯, rename and close
  buttons are 24 px (`Button size="xs"`) with 12 px icons, against Figma's
  14 px icons with no button box; they sit 4 px into the header's padding
  so the header keeps Figma's height (30 against 28). They are text
  buttons with an `fg.muted` class, Figma's grey, where the text variant
  draws the accent.
- **Chat header (Chat header).** The header (105:785) is within the 4 px
  tolerance only because its gaps are cut to the 4 and 8 px tokens: the
  title is `subtitle` (24 px line, Figma 21) and the model chip is taller
  than Figma's 22. The chat actions button is 24 px high
  (`Button size="xs"`, Figma 30 × 22).
- **Main chat.** `105:874` h +8: the reply wraps in body text (14/20) and
  Copy is 24 px (Figma 22), as in D01. `105:889` y -7, h +7: the
  attachment chip, the 20 px text line and the 28 px buttons of `Composer`
  are taller than Figma's, as in D01. The transcript and composer are 24
  in from the sides (Figma 22: the nearest spacing token).
- **Attachment remove × (Composer attachment remove).** Figma's × on the
  attached file is bold; `Composer` draws its own thin `CloseIcon`, in the
  same `fg.muted`.
- **Side chat.** `105:933` h +21 and `105:935` y +22, h +9: "Can Panda CSS switch
  themes while the app runs?" wraps to two lines in the render. `Message`
  pads the bubble 12, as Figma does, but the line is 1 px wider than the
  bubble's 321 px, so the answer starts 22 px lower. The panel is padded 16
  (Figma 17), and the bubble icon and "/btw" use `accent.discuss`.
- **Sidebar toggle.** The toggle (158:6) is a pressed `Button size="sm"`,
  28 px against Figma's 30; it sits after the title through the panel's
  `meta` slot. + is a `Button size="sm"` with a 16 px icon (Figma 36 × 28,
  14 px icon).
- **Skill-evals.** Figma draws skill-evals closed, so the state lists none
  of its chats; opening it shows no rows, though its count is 1.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
