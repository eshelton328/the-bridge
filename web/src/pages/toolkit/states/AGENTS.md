# states

One file per Figma state of the Toolkit, `satisfies ScreenState<Data,
Ui>`, listed in `index.ts`. Each file is also a canvas board
(`pnpm gen:registry`). Start one with
`pnpm new state <id> --page toolkit --frame <frame>`.

- Name a state `<subject><View>` (`skillFiles`, `hookLinks`) and add
  `Tablet` or `Phone` for a frame of that device (`ruleOpenPhone`).
- Open each file with `// Figma Toolkit <frame> "<frame name>":` and
  what the frame shows.
- A state that shows another state's data imports that state and
  changes only what its own frame changes; never copy the data.
- A new frame that shows a state's data exactly adds its frame to that
  state; a frame whose data differs gets a state of its own.
- Data that several states share and that is not a state goes in
  [shared/AGENTS.md](shared/AGENTS.md); read it before you add there.
- Add every new state to one screen in `screens.ts`, on its own device
  (screen review R10, `screens.test.ts`). A state with both a tablet and
  a phone frame fills both columns of its screen.
