# screens

`ToolkitScreen`, the page's one screen, its stories and the pure view
logic it uses. The screen lays itself out by its width
(`ViewportFrame`), so one component draws every device.

- A pure module is camelCase and ends in `View.ts` (`itemView.ts`). It
  takes the state's data and `ui` and returns what to draw or the next
  `ui`; its test sits at the page root.
- `ToolkitScreen.stories.tsx` (`Pages/Toolkit/States`) holds one story
  per state, named after its state file in PascalCase, with a play test
  that checks that state's own text (`pnpm check:states`).
- `ToolkitScreens.stories.tsx` (`Pages/Toolkit/Screens`) draws each
  screen of `../states/screens.ts` with its devices side by side.
