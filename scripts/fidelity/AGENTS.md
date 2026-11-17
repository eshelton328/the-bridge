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
| `checkText.ts`       | Every Figma string is in the render and seen; no visible text that Figma does not have                                                                             |
| `checkPosition.ts`   | Each `data-figma` element's box matches its Figma layer's box within the tolerance (4 px)                                                                          |
| `checkRules.ts`      | No text hidden or scrolled away by overflow, no scroll bar, the render fills the frame's height, no stretched pill                                                 |
| `inPage.ts`          | The measuring function that runs in the browser (text runs, boxes, rule findings), over the story root and any portal content in `body` (popovers, menus, dialogs) |
| `storyServer.ts`     | Serves `web/storybook-static`; finds the state file and story for a frame                                                                                          |
| `buildReferences.ts` | `pnpm fidelity:refs`: writes `frame.json` and `note.txt` from a saved `get_metadata` reply                                                                         |
| `figmaMetadata.ts`   | Parses `get_metadata` XML into a frame record; marks design-only chrome text as excluded                                                                           |
| `references.ts`      | Reads `frame.json` and `exceptions.json` with Zod                                                                                                                  |

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
6. **Fix and run again**, at most three rounds. A difference you cannot
   fix goes into `exceptions.json` with its reason, and on the
   deviations list for Erik.

## Exceptions

`references/<page>/<frameId>/exceptions.json` is written by hand; every
entry needs a reason. All keys are optional:

```json
{
  "missing": [{ "text": "Add a note…", "reason": "…" }],
  "extra": [{ "text": "Beta", "reason": "…" }],
  "position": [{ "layer": "task pane", "reason": "…" }],
  "rules": [{ "rule": "scrollBar", "selector": "section", "reason": "…" }]
}
```

Design-only chrome text (the iOS status bar and keyboard, d-089) is in
the `exclude` list of `frame.json`, which `buildReferences.ts` writes.

## Rules

- Never add an exception, raise the tolerance or change a check to make
  a frame pass when the render is wrong. Fix the screen.
- Each new error type that a reviewer or Erik finds becomes a check here,
  with a test.
- Test the pure functions in `*.test.ts` beside them (`pnpm test:scripts`).
  `inPage.ts` runs in the browser: no function in it may use anything from
  its module scope. Put a decision in a pure helper, pass it to
  `collectPage` through `collectPageScript`, and test it in `inPage.test.ts`.
