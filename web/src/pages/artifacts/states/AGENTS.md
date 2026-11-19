# Artifacts states

One file per Figma state of the Artifacts page, named for the state id
(`camelCase.ts`), plus `index.ts` and the screen map `screens.ts`.

- Start a state with `pnpm new state <id> --page artifacts --frame
  <D1>`; it adds the `index.ts` key and the story.
- Copy the words from `references/artifacts/<frame>/frame.json` word for
  word, and say the frame in `frames`.
- `library` (D1) holds what later states share. A state that opens a
  menu, searches or opens an artifact starts from it, or from the state
  it follows, and sets only its `ui` or adds its data.
- Export shared data (such as the card lists) only when a second state
  uses it: knip fails on an unused export.
- A state whose Discuss, Filter or ⋯ opens the next frame holds that
  frame's data, so the press shows it.
- Every state is in exactly one screen of `screens.ts`
  (`screens.test.ts`, screen review R10).
- The home is `../home.ts`, not a state.
