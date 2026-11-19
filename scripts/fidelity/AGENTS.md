# fidelity

The scripted checks of the fidelity loop (`pnpm fidelity`, `pnpm
fidelity:refs`, `pnpm fidelity:check-build`). They compare a rendered
page state with its Figma frame in
[../../references/AGENTS.md](../../references/AGENTS.md). The loop is in
the owner's brain:
`engine/projects/ncc-1701/product/features/f-005-the-bridge/fidelity-loop.md`.

Read [README.md](README.md) when you run the loop for one frame, read a
report, write an `exceptions.json` or need what `fidelity:check-build`
rejects.

## Rules

- Never add an exception, raise the tolerance or change a check to make
  a frame pass when the render is wrong. Fix the screen.
- Every exception needs a reason. A `missing` exception names the Figma
  text layers it covers by id (d-101).
- Each new error type that a reviewer or the owner finds becomes a check
  here, with a test.
- Test the pure functions in `*.test.ts` beside them (`pnpm test:scripts`).
- `inPage.ts` runs in the browser: no function in it may use anything
  from its module scope. Put a decision in a pure helper, pass it to
  `collectPage` through `collectPageScript`, and test it in
  `inPage.test.ts`.
- A frame with a status bar renders one viewport the bar's height shorter,
  and all three checks measure that render (d-089, d-102).
- The `fidelity-builder` agent's hooks call `pnpm fidelity:check-build`
  (`buildRecord.ts`); change its checks only with that agent in the
  owner's brain (`engine/projects/ncc-1701/toolkit/agents/`, d-040).
