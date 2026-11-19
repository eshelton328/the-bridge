# scripts

Node scripts the `package.json` scripts run. Each is TypeScript that Node
24 runs directly (type stripping), and each check prints one JSON line
and exits 1 on a problem.

| Script              | What it does                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `new.ts`            | `pnpm new page\|screen\|block\|state`: starts a file from `templates/`                                                                                       |
| `stateIndex.ts`     | Adds a state to a page's `states/index.ts` for `pnpm new state`, at the end, keeping the order and comments                                                  |
| `genRoutes.ts`      | Writes `web/src/app/routeTree.gen.ts`; `--check` fails when it is stale                                                                                      |
| `genRegistry.ts`    | Writes `web/src/design/registry.gen.ts`, one canvas board per state file; `--check`                                                                          |
| `checkStates.ts`    | Every state file is in its `states/index.ts` and has a story (d-082)                                                                                         |
| `checkStructure.ts` | Folders match `web/src/structure.ts`; each page has its files; a component file exports its own name; each store has a test                                  |
| `checkCycles.ts`    | No import cycle in `web/src` or `shared/src` (ported from the library)                                                                                       |
| `checkAgentsMd.ts`  | Every folder has an AGENTS.md, a CLAUDE.md shim, and a link from its parent (ported)                                                                         |
| `testShards.ts`     | Splits test files into CI shards by measured time (longest first, to the shard with the least time); `testSequencer.ts` is the Vitest sequencer that uses it |
| `shardTimes.ts`     | `pnpm shard:times <run-id>`: writes `testShardTimes.json`, each file's time in the test-unit shard jobs of a CI run                                          |

[fidelity/AGENTS.md](fidelity/AGENTS.md): `pnpm fidelity`, the text, position
and rule checks of the fidelity loop, and `pnpm fidelity:refs`.

`pnpm new`:

```sh
pnpm new page toolkit --state overview --frame T1   # a page, its route and first state
pnpm new screen InboxFilterScreen --page inbox       # a second screen of a page
pnpm new block InboxRow --page inbox                 # a page block; leave out --page for a shared block
pnpm new state filterOpen --page inbox --frame D4    # a state file, its index entry and its story
```

It leaves `TODO` markers; the tests fail until each is filled in.

## Rules

- A generator writes only `*.gen.ts` files and has a `--check` mode that
  `pnpm verify` runs.
- Test pure functions in a `*.test.ts` beside the script (`node --test`).
- `skillQuery.test.ts` tests a web helper's speed in Node, as Chromium's
  regex engine hides the backtracking that Safari and Node show.
- Change a template and its use in `new.ts` together, and run each
  `pnpm new` kind once in a scratch copy to prove the result passes
  `tsc` and the lint.
