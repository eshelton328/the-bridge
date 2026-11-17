# pages

One folder per page of the-bridge: `home`, `inbox`, `workspaces`,
`projects`, `artifacts` and `toolkit` (the list is in `structure.ts`).
Start one with `pnpm new page <page> --state <id> --frame <D1>`.

- [inbox/AGENTS.md](inbox/AGENTS.md): the Inbox, the first page built.
- [artifacts/AGENTS.md](artifacts/AGENTS.md): the Artifacts page, empty until its loop builds it.
- [toolkit/AGENTS.md](toolkit/AGENTS.md): the Toolkit page, empty until its loop builds it.

## A page folder

| File                              | What it is                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `<Page>Page.tsx`                  | The connected entry. The only file of the page that reads stores and the router          |
| `screens/`                        | Props-only screens, several per page, each with stories                                  |
| `blocks/`                         | Props-only blocks only this page uses                                                    |
| `states/`                         | One file per Figma state, `satisfies ScreenState<Data, Ui>`, and `index.ts` listing them |
| `<page>Store.ts`                  | The page's view store, made with `createAppStore`, with a test                           |
| `types.ts`                        | The view-model Zod schemas and their inferred types                                      |
| `search.ts`, `load<Page>State.ts` | The URL search schema and the route loader                                               |
| `definition.ts`                   | The page as the canvas sees it (`PageDefinition`)                                        |
| `index.ts`                        | The public entry: routes and `design/` import only this                                  |

## Rules

- A page never imports another page. A block a second page needs moves
  to `../blocks/`.
- Screens and blocks import only `types.ts` from the page root, never the
  store or the entry.
- A state file copies Figma's text word for word and says its frame
  (`{ id: 'D1', node: '346:5', viewport: 'desktop' }`). Its story is named
  after it in PascalCase (`nextStep` → `NextStep`) and renders
  `<page>States.<id>`.
