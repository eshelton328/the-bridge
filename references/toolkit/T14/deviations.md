# T14 deviations

What still differs from Figma after the fidelity loop (pnpm fidelity
  toolkit T14, 2026-11-18, against library 1.0.0-beta.42: a first run
  and three fix rounds), each with its reason. The state is
  web/src/pages/toolkit/states/toolkitActivityChatTablet.ts: the chat on
  a page of its own under Activity › Chats. The library gaps are in
  web/src/pages/toolkit/LIBRARY_GAPS.md. Every other Toolkit frame gives
  the same text, position and rule results as before these frames. The
  frame has no exceptions.json.

## Checks

- Text: pass. Every Figma string is in the render and visible.
- Position: 8 of 28 layers pass. The 20 that fail: `back row` h +8;
  `side panel · chat` h -44; `button · Open session` y -6; `fields` y -8
  h -11; `field · Started` y -8; `field · Length` y -9;
  `field · Project` y -11; `field · From` y -14; `field · Model` y -15;
  `field · Messages` y -16; `field · Tokens` y -17;
  `field · Hook blocks` y -18; `toolkit items` y -24 w +6.8;
  `link · writing-reviewer` y -24 w +6.8; `steps` y -30; `tool · Bash` y
  -30; `tool · Agent` y -30; `tool · SendMessage` y -30; `tool · Write`
  y -30; `tool · Edit` y -30. Each is explained below.
- Rules: pass.

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
- **Panel** (`side panel · chat` h -44). Figma's chat runs to 815; the
  render's ends with the last tool.
- **Button** (`button · Open session` y -6). The header and the line
  over it start 2 px higher each (the 12 px gaps).
