# fidelity

The scripted checks of the fidelity loop: they compare a rendered page
state with its Figma frame. The loop itself (reference, build, render,
check, second review, fix, ship) is in Erik's brain:
`~/ncc-1701/engine/projects/ncc-1701/product/features/f-005-the-bridge/fidelity-loop.md`.
The Figma references the checks read are in
[../../references/AGENTS.md](../../references/AGENTS.md).

| File                 | What it does                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fidelity.ts`        | `pnpm fidelity <page> [frameId…]`: renders each frame's story and runs the three checks                                                                            |
| `checkText.ts`       | Every Figma string is in the render and seen; no visible text that Figma does not have; a `missing` exception skips only the layers it names                       |
| `checkPosition.ts`   | Each `data-figma` element's box matches its Figma layer's box within the tolerance (4 px), measured below Figma's status bar on a tablet or phone                  |
| `checkRules.ts`      | No text hidden or scrolled away by overflow, no scroll bar, the render fills its viewport's height, no stretched pill                                              |
| `inPage.ts`          | The measuring function that runs in the browser (text runs, boxes, rule findings), over the story root and any portal content in `body` (popovers, menus, dialogs) |
| `sideBySide.ts`      | Draws the side-by-side PNG (Figma left, render right) in a new page, so no popover of the story leaks into it                                                      |
| `storyServer.ts`     | Serves `web/storybook-static`; finds the state file and story for a frame                                                                                          |
| `buildReferences.ts` | `pnpm fidelity:refs`: writes `frame.json` and `note.txt` from a saved `get_metadata` reply                                                                         |
| `figmaMetadata.ts`   | Parses `get_metadata` XML into a frame record; marks design-only chrome text as excluded                                                                           |
| `references.ts`      | Reads `frame.json` and `exceptions.json` with Zod                                                                                                                  |
| `buildRecord.ts`     | The fidelity-builder agent's build record and the checks of it: matches the last report, deviations.md names each failure, gaps, no guarded file changed           |
| `checkBuild.ts`      | `pnpm fidelity:check-build <record.json \| ->`: runs those checks against this checkout; `--guard <path>` says whether the agent may change a file                 |

## Run the loop for one frame

1. **Reference.** Check that `references/<page>/<frameId>/` has
   `frame.png`, `frame.json` and `note.txt`. The note is documentation
   for you; its text never goes into the UI.
2. **Build.** Write or change the state file
   (`pnpm new state <name> --page <page> --frame <code>`) and the screen.
   Put `data-figma="<layer name>"` on the elements that stand for a
   Figma layer (pane, header, row); use the node id (`346:146`) when the
   name is not unique in the frame. Find names and boxes in `frame.json`.
3. **Check.** Run `pnpm fidelity <page> <frameId>`, for example
   `pnpm fidelity inbox D01`. It builds Storybook first; add
   `--skip-build` when nothing in `web/` changed since the last build.
   It exits 1 when a check fails.
4. **Read the report** in `reports/fidelity/<page>/` (gitignored):
   `<frameId>.json` has the result of each check, and
   `<frameId>.sideBySide.png` shows Figma left and the render right.
   - `text.missing`: Figma strings the DOM does not have.
   - `text.notVisible`: strings the DOM has but a viewer cannot see in
     full (clipped in part, scrolled away), where Figma shows them in the
     frame. Each Figma layer needs its own visible occurrence: two layers
     with the same text need the text twice on screen.
   - `text.extra`: visible render text that Figma does not have.
   - `position.diffs`: boxes off by more than the tolerance, with the
     delta per edge; also unknown, ambiguous or duplicate keys.
   - `rules.findings`: `hiddenOverflow`, `scrollBar`, `fullHeight`,
     `badgeFullWidth`, each with the element's selector.
5. **Second review.** Give a separate agent only the side-by-side PNG and
   the report JSON. It lists each difference with a severity (P1 to P4).
   In Erik's brain that agent is `fidelity-reviewer`.
6. **Fix and run again**, at most three rounds. A difference you cannot
   fix goes into `exceptions.json` with its reason, and on the
   deviations list for Erik.

## The fidelity-builder agent

`fidelity-builder` runs steps 1 to 4 and 6 for one frame in a worktree,
at most three fix rounds, and returns a JSON build record; the caller runs
step 5 with `fidelity-reviewer` on the record's side-by-side PNG and
deviations, then ships the branch. Both agents live in Erik's brain
(`~/ncc-1701/engine/projects/ncc-1701/toolkit/agents/`, d-040), and its
hooks call `pnpm fidelity:check-build` in the worktree: `--guard` before
each edit, and the record check before it replies. The record check
fails when:

- the record's fidelity result is not the last report's, or a file in
  `web/` or the frame's references changed after that report;
- the report fails and `deviations.md` does not name each failing
  position key, rule and text;
- a listed gap is not a `LIBRARY_GAPS.md` row whose Frames cell includes
  the frame, or the state file does not list the frame;
- the branch changes `scripts/`, CI, a saved reference, a baseline, check
  config or `package.json`, deletes a test or removes lines from one, or a
  story sets `globals.viewport`.

## Exceptions

`references/<page>/<frameId>/exceptions.json` is written by hand; every
entry needs a reason. All keys are optional:

```json
{
  "missing": [{ "text": "Add a note…", "layers": ["346:1189"], "reason": "…" }],
  "extra": [{ "text": "Beta", "reason": "…" }],
  "position": [{ "layer": "task pane", "reason": "…" }],
  "rules": [{ "rule": "scrollBar", "selector": "section", "reason": "…" }]
}
```

A `missing` entry names the Figma text layers it covers by id
(`layers`, one or more); the text check skips only those layers, so the
same text in another layer is still checked (d-101). Each id must be a
text layer with that text, or the check stops with an error.

Design-only chrome text (the iOS status bar and keyboard, d-089) is in
the `exclude` list of `frame.json`, which `buildReferences.ts` writes.

The app draws no status bar (d-089). On a frame with one (tablet 29 px,
phone 38 px; the top-level layer at y 0 that holds the excluded
status-bar text), `pnpm fidelity` renders the page once, in a viewport
the bar's height shorter (`renderViewport` in `checkPosition.ts`), and
all three checks measure that render (d-102): text below its bottom edge
is not shown, the full-height rule wants that height, and the position
check adds the bar's height to each render y (d-101). That render is
`<frameId>.render.png`, and the side-by-side draws it that much lower,
under a blank band where Figma has the bar. Desktop frames have no status
bar and render at their full size.

## Rules

- Never add an exception, raise the tolerance or change a check to make
  a frame pass when the render is wrong. Fix the screen.
- Each new error type that a reviewer or Erik finds becomes a check here,
  with a test.
- Test the pure functions in `*.test.ts` beside them (`pnpm test:scripts`).
  `inPage.ts` runs in the browser: no function in it may use anything from
  its module scope. Put a decision in a pure helper, pass it to
  `collectPage` through `collectPageScript`, and test it in `inPage.test.ts`.
