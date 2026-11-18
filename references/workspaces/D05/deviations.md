# D05 deviations

What still differs from Figma after the first build of the side chat in
split panes (`pnpm fidelity workspaces`, 2026-11-17, after the move to
the library's 1.0.0-beta.16; measured on 1.0.0-beta.18), each with its reason. The
library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is D01's four panes with no menu or skill list open, and the side
chat of bridge themes drawn inside that pane, over the chat's right side
(`SideChatPanel placement="pane"`, the `overlay` of its `ChatPane`).

## Checks

- Text: pass. The four context percentages (`42%` 158:199, `23%`
  158:282, `78%` 158:390, `64%` 158:404) pass without an exception:
  `ContextMeter` draws each as one text node. `Artifacts` and `Toolkit` on
  the rail are excepted as on D01 to D04 (d-105).
- Position: 11 of 27 layers pass (`nav rail`, `158:119`, `158:186`,
  `158:219`, `158:326`, `158:271`, `158:313`, `158:357`). `158:168`,
  `158:224`, `158:239`, `158:518`, `158:530`, `158:531`, `158:533`,
  `open as pane`, `158:545`, `158:347`, `158:300`, `158:380` and
  `158:394` fail. The empty pane's list (158:378) is not measured:
  `EmptyPane` takes no `data-figma` (Empty pane rows); its two rows
  (158:380, 158:394) are.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

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
  the sidebar toggle (`158:119`) before the tabs (`leading`, 28 px against
  Figma's 30). The four tabs are 35 px wider than Figma's together, so
  New chat (`158:168`) sits x +34.7.
- **Panes.** `158:224` y +4.5, h +8: the reply wraps in body text (14/20),
  and Copy is 24 px. `158:300` h +6: `ProposalBlock`. `158:347` h -5: the
  terminal ends 5 px higher than Figma's.
- **Composer.** `158:239` y -7.5, h +7: the attachment chip, the text line and the
  buttons of `Composer` are taller than Figma's, as on D01. Figma draws
  the composer focused with a caret after "/"; the story does not focus
  it.
- **Side chat box (Side chat in a pane).** `158:518` x +10.5, w -10: the box is 320 wide (`shell.popover`, the nearest width
  token; Figma 330), so its left edge is 10 px further right; it is 4 in
  from the pane's body on the right, top and bottom, as Figma's. The fill is `surface.overlay`, the border
  `border.active` (cyan), the radius `radii.lg` (10) and the shadow
  `shadows.overlay`: d-100 picks, as Figma's colours have no other token.
  The border reads a little brighter than Figma's.
- **Side chat contents (Side chat in a pane).** The box is padded 16
  (Figma 15), so the inner column is 288 wide against Figma's 300:
  `158:530` x +12.5, y +12, w -14, h +16: the note, in `small` (12/16;
  Figma's is smaller), wraps to two lines where Figma's fits one;
  `158:531` x +12.5, y +28, w -14, h +7 and `158:533` x +12.5, y +35,
  w -14, h +13: the question bubble and the reply use `Message` in body
  text (14/20, Figma 13/17), so the reply wraps differently and is
  taller. The /btw command is `monoSm` in `fg.muted` and the chat icon is
  `fg.accent` (Figma cyan); the D2 side chat keeps its own colours.
- **Open as its own pane (Side chat in a pane).** `open as pane` x +12.5,
  y -38, w +11.1: a `Button size="xs" textSize="xs"` with
  `SplitIcon` 12, 24 px high (Figma 26) and 11 px wider. It sits 38 px
  higher because the composer under it is taller.
- **Side chat composer (Side chat in a pane).** `158:545` x +12.5, y -40,
  w -14, h +38: `Composer` always draws two rows, the text over the button
  row (78 px), where Figma draws one 40 px row with the placeholder and a
  22 px send button. It has no attach button, as Figma's has none.
- **Shell pane.** `TerminalLines` draws the block cursor after the
  prompt "$", as Figma does; the terminal ends 5 px higher (`158:347`
  h -5), as on D01.
- **Empty pane (Empty pane rows).** `158:380` y -5.5, h +6 and `158:394`
  h +6: the OPEN IN THIS PANE rows are `ListRow density="compact"`,
  56 px against Figma's 50, as on D01.
- **Sticky composer (d-107).** Only the transcript of each chat pane and
  of the side chat scrolls; the headers and composers stay in view. The
  frame shows the top of the scroll, so this changes no pixel here.
- **Approval buttons.** Deny is `variant="secondaryDanger"`: red text on
  the raised fill with a border, as Figma draws it beside Always allow.
- **Bridge themes under the side chat.** The chat's user bubble, reply
  and composer (with Stop and send) run under the side chat as in Figma.
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
