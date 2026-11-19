# Workspaces states

One file per Figma frame of the Workbench, named camelCase after what it
shows; a T frame starts with `tablet`, an M frame with `phone`. Make
one with `pnpm new state <id> --page workspaces --frame <D1>`,
which adds its `index.ts` entry and its story.

- Every state but `workbench` starts from an earlier one
  (`...phoneHome.data`) and changes only what its frame changes.
  Its header comment names the frame, its node and that state.
- The first key of `index.ts` (`workbench`) is the page's default state.
  The home with no `?state=` is `../home.ts`, not a state.
- Add each new state to one screen of `screens.ts`, on its own device
  (review R10, `screens.test.ts`). The split panes and their drags are
  desktop only (review R19).
