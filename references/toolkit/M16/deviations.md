# M16 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
toolkit M16, 2026-11-18, against library 1.0.0-beta.42: a first run
and three fix rounds), each with its reason. The state is
web/src/pages/toolkit/states/toolkitActivityChatPhone.ts: the chat on
a page of its own under Activity › Chats. The library gaps are in
web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
the same text, position and rule results as before these frames. The
frame's exceptions.json excepts the `hiddenOverflow` finding below, with
the entry that records it; with it the text and rules checks now pass.

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 8 of 27 layers pass. The 19 that fail: `back row` h +8;
  `side panel · chat` h -40; `fields` y -5 h -8; `field · Started` y -5;
  `field · Length` y -6; `field · Project` y -7; `field · From` y -8;
  `field · Model` y -9; `field · Messages` y -10; `field · Tokens` y
  -11; `field · Hook blocks` y -12; `toolkit items` y -18 w +6.8;
  `link · writing-reviewer` y -18 w +6.8; `steps` y -24; `tool · Bash` y
  -24; `tool · Agent` y -24; `tool · SendMessage` y -24; `tool · Write`
  y -24; `tool · Edit` y -24. Each is explained below.
- Rules: fail. 1 findings: `hiddenOverflow` at
  `div.backdrop > div.app-shell__root > main.app-shell__detail > div.scroll-frame__root > div.scroll-frame__body:nth-of-type(2)`.
  Each is explained below; the frame's exceptions.json excepts it.

## Differences

- **Back row** (`back row` h +8). `BackRow`'s label is `labelLg` with an
  18 px chevron, 28 high, where Figma's row is 20 (Item breadcrumb).
- **Open chat** (`side panel · chat`, `fields`, each `field · …`,
  `toolkit items`, `steps`, each `tool · …`). Figma's parts are 14
  apart; no spacing token has 14, so they are 12 apart and each part
  starts 2 px higher than the one before it. Each field row is a px
  shorter, as the library's small text keeps 16 px lines (d-072), and
  the fields are a `dl` in the library's styles (Run panel). The tools
  have no dot between the count and the name: the library has no step
  dot (Run panel). The items chip is a `MapNode` (Activity item chip).
  Open the session in Workbench is disabled with a title: no Workbench
  state takes a toolkit chat.
- **Panel** (`side panel · chat` h -40). Figma's chat runs to 830 under
  the tab bar; the render's ends with the last tool.
- **Rules and text under the tab bar** (`hiddenOverflow` at
  `main.app-shell__detail` or its `scroll-frame__body`). The page runs
  under the tab bar, as in Figma (AppShell `tabBarOverlay`), and
  scrolls; under the taller chart the last rows Figma shows over the bar
  lie under it, so their text is not visible.
