# the-bridge

The-bridge is NCC-1701's interface: a React app, its server and the
checks that hold both to the Figma design. Every screen state is a typed
state file that renders in the app, in Storybook and on the Claude
Design canvas (`window.Bridge`).

Planning lives in the owner's brain, not here. The decisions (`d-NNN`)
that the AGENTS.md files cite are in
`~/ncc-1701/engine/projects/ncc-1701/decisions/`.

Before you read or edit files in a folder, read each `AGENTS.md` from
here down to that folder.

## Workspace

pnpm workspace; every version is pinned once in the catalog of
`pnpm-workspace.yaml` (`catalogMode: strict`), and a package writes
`"catalog:"`.

- [web/AGENTS.md](web/AGENTS.md): read before you work on the app, its
  Storybook or the canvas bundle.
- [shared/AGENTS.md](shared/AGENTS.md): read before you add code that web
  and the server both use.
- [contract/AGENTS.md](contract/AGENTS.md): read before you change the API
  between the server and its clients (d-111).
- [server/AGENTS.md](server/AGENTS.md): read before you work on the server
  or its agent port (d-110).
- [e2e/AGENTS.md](e2e/AGENTS.md): read before you run or change the local
  E2E suite (d-113).
- [scripts/AGENTS.md](scripts/AGENTS.md): read before you change a
  generator, a check or `pnpm new`.
- [references/AGENTS.md](references/AGENTS.md): read before you save or
  change a Figma reference frame.

## Verify

Run `pnpm verify` before you finish. CI runs the same steps as separate
jobs in `.github/workflows/ci.yml`; a new step in `verify` needs a
`run: pnpm <step>` line there, or `pnpm check:ci` fails.

## Secret scan

The `secrets` job in `ci.yml` runs gitleaks on each PR with the rules in
`.gitleaks.toml` and the personal terms from the repository secret
`PRIVACY_TERMS`. `secret-history.yml` scans the full history each week.

- Never put a personal value in `.gitleaks.toml`. Add an exception only
  for one fixed path and one rule (the file's own header says so).
- `references/` keeps the names Figma draws, so it is an exception for
  the personal-term rule only.
- Read [scripts/secrets/AGENTS.md](scripts/secrets/AGENTS.md) before you
  change a rule or an exception.

## Rules

- No `any`, `as` casts, non-null `!`, `@ts-ignore`, `@ts-expect-error` or
  `eslint-disable` comments; the lint rejects them. Fix the code instead.
- Never weaken, skip or delete a test or a check to make it pass.
- A value no design token has is a gap: stop and name it. Do not use a
  raw value or the nearest token.
- Generated files end in `.gen.ts`. Never edit one; run its generator
  (`pnpm gen:routes`, `pnpm gen:registry`).
- Commits are small and conventional (`feat(web): …`).
