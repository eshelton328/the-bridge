# Projects states

One file per PNG reference of the Projects page (`references/projects/`),
listed in `index.ts`. Make one with
`pnpm new state <id> --page projects --frame <D10>`, which adds its
`index.ts` entry and its story.

- A frame's node is the Figma node of the read-only file
  `yJaVpShE9RVoQwUeUBnMQ4` that its `reference.json` source names.
- `menuOpen` (D10) holds the data the others share: the brain's three
  projects on 2026-11-26, word for word, NCC-1701 pinned, except the
  owner's name, which the secret scan keeps out of `web/` ("The owner's").
  The others set only the Inbox count their bars draw and close the menu.
- Every state is in exactly one screen of `screens.ts`
  (`screens.test.ts`, screen review R10). The home is `../home.ts`.
