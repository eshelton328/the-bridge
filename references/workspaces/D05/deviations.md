# D05 deviations

What still differs from Figma after the first build of the side chat in
split panes (`pnpm fidelity workspaces D05`, 2026-11-17, fix round 3,
against the installed library 1.0.0-beta.9), each with its reason. The
library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is D01's four panes with no menu or skill list open, and the side
chat of bridge themes drawn inside that pane, over the chat's right side
(`SideChatPanel placement="pane"`, the `overlay` of its `ChatPane`).

## Checks

- Text: pass. The four context percentages (`42%` 158:199, `23%`
  158:282, `78%` 158:390, `64%` 158:404) are in `exceptions.json`, as on
  D01 (ContextMeter percentage). `Artifacts` and `Toolkit` on the rail
  are excepted as on D01 to D04 (d-105).
- Position: 3 of 20 layers pass (`nav rail`, `158:168`, `158:313`).
  `158:119`, `158:186`, `158:219`, `158:224`, `158:239`, `158:518`,
  `158:530`, `158:531`, `158:533`, `open as pane`, `158:545`, `158:326`,
  `158:347`, `158:271`, `158:300`, `158:357` and `158:378` fail.
- Rules: pass.
- D01, D02, D02b, D03 and D04 give the same report as before this build
  (`pnpm fidelity workspaces D01 D02 D02b D03 D04 --skip-build`): none got
  worse.

## Deviations

- **Tab bar height (Workbench tab bar).** As on D01, every pane starts
  16 px lower and is 9 px shorter: `158:186` y +16, h -9; `158:271` y +16,
  h -9; `158:326` y +7, h -9; `158:357` y +7, h -9. The layers inside move
  with them: `158:219` y +19.5, `158:224` y +20.5, h +8 (the reply wraps
  in body text, 14/20, and Copy is 24 px), `158:300` y +20, h +6
  (`ProposalBlock`), `158:347` y +11, h -13 (the terminal).
- **Composer.** `158:239` h +7: the attachment chip, the text line and the
  buttons of `Composer` are taller than Figma's, as on D01. Figma draws
  the composer focused with a caret after "/"; the story does not focus
  it.
- **Sidebar toggle (Sidebar toggle).** `158:119` x +533.7, y +4, w -2,
  h -2: the toggle sits after New chat at the end of the tabs, 28 px,
  because `Workbench` has no slot before the tabs (as D01's `158:2`).
- **Side chat box (Side chat in a pane).** `158:518` x +10.5, y +20,
  w -10, h -12: the box is 320 wide (`shell.popover`, the nearest width
  token; Figma 330), so its left edge is 10 px further right; it is 4 in
  from the pane's body on the right, top and bottom, as Figma's, and moves
  down with the pane (tab bar). The fill is `surface.overlay`, the border
  `border.active` (cyan), the radius `radii.lg` (10) and the shadow
  `shadows.overlay`: d-100 picks, as Figma's colours have no other token.
  The border reads a little brighter than Figma's.
- **Side chat contents (Side chat in a pane).** The box is padded 16
  (Figma 15), so the inner column is 288 wide against Figma's 300:
  `158:530` x +12.5, y +28, w -14, h +16: the note, in `small` (12/16;
  Figma's is smaller), wraps to two lines where Figma's fits one;
  `158:531` x +12.5, y +44, w -14, h +7 and `158:533` x +12.5, y +51,
  w -14, h +13: the question bubble and the reply use `Message` in body
  text (14/20, Figma 13/17), so the reply wraps differently and is
  taller. The /btw command is `monoSm` in `fg.muted` and the chat icon is
  `fg.accent` (Figma cyan); the D2 side chat keeps its own colours.
- **Open as its own pane (Side chat in a pane).** `open as pane` x +12.5,
  y -30, w +11.1, h -2: a `Button size="xs" textSize="xs"` with
  `SplitIcon` 12, 24 px high (Figma 26) and 11 px wider. It sits 30 px
  higher because the composer under it is taller.
- **Side chat composer (Side chat in a pane).** `158:545` x +12.5, y -32,
  w -14, h +38: `Composer` always draws two rows, the text over the button
  row (78 px), where Figma draws one 40 px row with the placeholder and a
  22 px send button. It has no attach button, as Figma's has none.
- **Shell pane (Terminal output).** No block cursor after the prompt "$",
  as on D01.
- **Empty pane.** `158:378` y -10.5, h +27: the OPEN IN THIS PANE rows are
  56 px `ListRow`s (Figma 50), as on D01.
- **Bridge themes under the side chat.** The chat's user bubble, reply
  and composer (with Stop and send) run under the side chat as in Figma.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
