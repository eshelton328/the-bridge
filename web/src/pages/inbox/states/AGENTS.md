# Inbox states

One file per Figma state of the Inbox, named for the state id
(`camelCase.ts`), plus `index.ts` and the screen map `screens.ts`.

- Start a state with `pnpm new state <id> --page inbox --frame <D1>`; it
  adds the `index.ts` key and the story.
- Copy the words from `references/inbox/<frame>/frame.json` word for
  word, and say each frame in `frames`.
- `nextStep` (D1) holds what every state shares: the Sort, Filter and
  Snooze menus, the Run in picker and the row tags. A state that shows a
  menu or a sort sets only its `ui`.
- A state starts from `nextStep` or from the state it follows (as the
  discussion states start from `discussOpen`) and changes only what its
  frame changes.
- A tablet or phone state that shows only the list sets `selectedId` to
  null.
- One state may serve a tablet and a phone frame; name both devices for
  it in `screens.ts`, so its screen shows the phone column too.
- Every state is in exactly one screen of `screens.ts`
  (`screens.test.ts`, screen review R10).
- The home is `../home.ts`, not a state.
