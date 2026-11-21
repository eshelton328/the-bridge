# scripts

Node scripts that the root `package.json` scripts run. Each is
TypeScript that Node 24 runs directly (type stripping), named in
camelCase (the lint's file-name rule).

- A check prints one JSON line and exits 1 on a problem.
- A generator writes only `*.gen.ts` files and has a `--check` mode that
  `pnpm verify` runs.
- Test pure functions in a `*.test.ts` beside the script; `pnpm
  test:scripts` runs this folder and `fidelity/`, not `secrets/`.
- `skillQuery.test.ts` tests a web helper's speed in Node, as Chromium's
  regex engine hides the backtracking that Safari and Node show.
- Each config gate of the type-safety audit (G-1 to G-3) has a planted
  case in `configGates.test.ts`.
- Change a template in `templates/` and its use in `new.ts` together, and
  run each `pnpm new` kind once in a scratch copy to prove the result
  passes `tsc` and the lint.
- `viteConfig.test.ts` holds web/vite.config.ts's `/api` proxy rule: no
  default target, so `vite` and `vite preview` stop without
  `BRIDGE_SERVER_URL`, and the build, Vitest and Storybook start without it.
- `keyboardTracePlugin.ts` is a dev-server plugin (`apply: 'serve'`); a
  build must never include it. No client text may reach a trace file's
  path (`keyboardTracePlugin.test.ts`).

Read [README.md](README.md) when you run `pnpm new`, `pnpm
keyboard:served` or change the keyboard trace endpoint.

## Folders

- [fidelity/AGENTS.md](fidelity/AGENTS.md): read before you run or change
  `pnpm fidelity` or `pnpm fidelity:refs`.
- [secrets/AGENTS.md](secrets/AGENTS.md): read before you change the
  secret scan's rules, exceptions or tests.
- `templates/` holds the files `pnpm new` starts from.
