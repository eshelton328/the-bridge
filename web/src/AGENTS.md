# web/src

The app's source, organised by page (d-088). `structure.ts` lists the
layers and what each may import; the lint (`eslint.config.js`),
`scripts/checkStructure.ts` and `scripts/new.ts` read it.

| Folder                      | What it holds                                              | May import                               |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| [app/](app/AGENTS.md)       | `main.ts`, the router, the generated route tree            | routes, state, errors, lib               |
| [routes/](routes/AGENTS.md) | TanStack file routes, thin                                 | a page's `index.ts`                      |
| [pages/](pages/AGENTS.md)   | One folder per page: entry, screens, blocks, states, store | its own page, blocks, state, errors, lib |
| [blocks/](blocks/AGENTS.md) | Blocks two or more pages use; props-only                   | blocks, errors, lib                      |
| [state/](state/AGENTS.md)   | App-wide Zustand stores and `createAppStore`               | state, lib                               |
| [errors/](errors/AGENTS.md) | Boundaries, fallbacks, the reporter                        | errors, lib                              |
| [lib/](lib/AGENTS.md)       | Types and helpers with no React state                      | lib                                      |
| [design/](design/AGENTS.md) | The canvas bundle and its registry                         | pages' `index.ts`, blocks, errors, lib   |

## Rules

- Imports go down the table, never across pages. A layer may import its
  own folder, but no import cycle (`pnpm check:cycles`).
- Name each export; no default exports except where a tool needs one
  (stories, configs), and no `export *`.
- One component per file, about 150 lines at most.
- `index.css` and `canvas.css` declare the CSS layers.
