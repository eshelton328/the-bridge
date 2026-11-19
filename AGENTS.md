# the-bridge

The-bridge is NCC-1701's interface: a React app that shows the owner's inbox,
workspaces, projects, artifacts and toolkit. Increment 1 is a mock-up from
code: every screen renders typed mock data, one state file per Figma
state, in the app, in Storybook and on the Claude Design canvas
(`window.Bridge`).

Planning lives in the owner's brain, not here. The decisions (`d-NNN`) are in
`~/ncc-1701/engine/projects/ncc-1701/decisions/`: the monorepo (d-080),
the layers (d-081, replaced in part by d-088), state files (d-082),
Zustand rules (d-083), errors (d-084), generated code and types (d-085),
ErrorState in the library (d-086), Biome (d-087), pages and camelCase
(d-088) and app blocks (d-089).

## Workspace

pnpm workspace; every version is pinned once in the catalog of
`pnpm-workspace.yaml` (`catalogMode: strict`), and a package writes
`"catalog:"`.

- [web/AGENTS.md](web/AGENTS.md): the app, its Storybook and the canvas
  bundle. Most work happens here.
- [shared/AGENTS.md](shared/AGENTS.md): `@bridge/shared`, code that web
  and a later server both use: the `Result` union and branded ids.
- [scripts/AGENTS.md](scripts/AGENTS.md): the generators, the checks and
  `pnpm new`.
- [references/AGENTS.md](references/AGENTS.md): the saved Figma frames
  (picture, layers, note) that the fidelity checks compare against.
  `pnpm fidelity <page> [frameId…]` runs those checks; see
  [scripts/fidelity/AGENTS.md](scripts/fidelity/AGENTS.md). The
  `fidelity-builder` agent builds one frame at a time with them, and
  `pnpm fidelity:check-build` checks the record it returns.

## Verify

Run `pnpm verify` before you finish. It runs Panda codegen, the route
tree and canvas registry checks, `tsc`, ESLint, the Biome format check,
knip, the AGENTS.md, cycle, structure and story-per-state checks, the
script tests, the Vitest browser tests (unit tests and every story's play
test), and both builds. CI runs the same steps as separate jobs in
`.github/workflows/ci.yml`; a new step in `verify` needs a line there.

## Rules

- No `any`, `as` casts, non-null `!`, `@ts-ignore`, `@ts-expect-error` or
  `eslint-disable` comments; the lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check to make it pass.
- A value no design token has is a gap: stop and name it. Do not use a
  raw value or the nearest token.
- Generated files end in `.gen.ts`. Never edit one; run its generator
  (`pnpm gen:routes`, `pnpm gen:registry`).
- Commits are small and conventional (`feat(web): …`).
