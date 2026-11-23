# fidelity

The scripted checks of the fidelity loop: `pnpm fidelity` compares a
rendered page state with its saved Figma frame in
[../../references/](../../references/AGENTS.md). Agents read
[AGENTS.md](AGENTS.md) for the rules. The loop itself is in the owner's
brain:
`~/ncc-1701/engine/projects/ncc-1701/product/features/f-005-the-bridge/fidelity-loop.md`.

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
   It exits 1 when a check fails. `--checks text,rules` makes only
   those checks decide the exit code (the report's `gate`); the report
   still holds all three, and its `ok` stays the result of all three.
   `fidelity:check-build` rejects a report made with `--checks` that
   left out a check. `--checks` also takes `icons`: no `iconSize` diff
   (below), whatever the other position diffs. CI's `fidelity` job runs
   every frame of each page with `--checks text,rules`, and adds `icons`
   for each page in the job's `ICON_GATED_PAGES`.
4. **Read the report** in `reports/fidelity/<page>/` (gitignored):
   `<frameId>.json` has the result of each check, and
   `<frameId>.sideBySide.png` shows Figma left and the render right.
   - `text.missing`: Figma strings the DOM does not have.
   - `text.notVisible`: strings the DOM has but a viewer cannot see in
     full (clipped in part, scrolled away), where Figma shows them in the
     frame. Each Figma layer needs its own visible occurrence: two layers
     with the same text need the text twice on screen. A string that
     another element covers in the render (an open menu over a pane) is
     not visible either, marked `covered`, unless Figma draws a later
     layer over the same text layer too. A library `Glyph` keeps its ✗ or
     ✓ in the text at font size 0 and transparent and draws the mark as
     an SVG icon: its character (`glyph__char` in a `glyph__root`) is
     measured by that icon, which must be shown, at least 1 px, in view
     and not covered, as text must (`isGlyphChar` in `inPage.ts`), and
     draw a mark: a shown shape with a box and a stroke or fill that is
     not none or transparent (`iconHasMark`). Over the icon, as for the
     icon size check, an svg covers only by its own background, a shape
     of another svg does (`iconHitPaints`). A zero-size character
     anywhere else is not shown.
   - `text.extra`: visible render text that Figma does not have.
   - `position.diffs`: boxes off by more than the tolerance, with the
     delta per edge; also unknown, ambiguous or duplicate keys; and
     `iconSize`: a Figma icon (a layer named `icon/…`, `kind · …`,
     `logo · …` or `chevron · …`) whose render icon,
     the svg whose centre is nearest within the tolerance, is more than
     2 px bigger or smaller (`checkIcons.ts`). An svg that another
     element draws over at its centre is not matched. Its key is the
     icon's node id, which a `position` exception can name; give the
     entry `"iconSize": <px>` so only that render size (± 2 px) passes.
     A Figma icon with no render icon at its place is not compared.
   - `rules.findings`: `hiddenOverflow`, `scrollBar`, `fullHeight`,
     `badgeFullWidth`, each with the element's selector.
5. **Second review.** Give a separate agent only the side-by-side PNG and
   the report JSON. It lists each difference with a severity (P1 to P4).
   In the owner's brain that agent is `fidelity-reviewer`.
6. **Fix and run again**, at most three rounds. A difference you cannot
   fix goes into `exceptions.json` with its reason, and on the
   deviations list for the owner.

## PNG references

A page with no Figma frame has PNG references
([../../references/AGENTS.md](../../references/AGENTS.md)): `frame.png`
and a hand-written `reference.json`, with no `frame.json`. `pnpm fidelity
<page>` finds both kinds. For a PNG frame it:

- renders the story at the reference's size, with the browser in the
  reference's `mode` (`prefers-color-scheme`), and no status bar;
- labels the frame `PNG reference: text, position and icons not checked`
  in its report and in the summary;
- lists text, position and icons under `notRun`, as a PNG has no layers.
  `--checks` with any of them fails the frame with an error;
- runs the rule check (`checks: ["rules"]`) and the reviewer's gate, and
  the frame passes only when both pass. The gate needs `--review <file>`:
  the `fidelity-reviewer` agent's JSON record of the frame's side-by-side,
  from step 5. The run renders the frame again and takes the record only
  when the new render is byte for byte the one the reviewer saw; any P1
  or P2 finding, an `unreviewable` verdict, no record or a changed render
  fails the frame (`pngReview.ts`). So a PNG frame takes two runs: one
  without `--review` (it fails with `noReview`) for the side-by-side, and
  one with the record;
- writes `pixels` (pixels whose channels differ by more than 32 of 255,
  and their ratio) and `<frameId>.diff.png` (red where they differ). The
  ratio is not a gate: a lab screenshot and a built page differ in fonts
  and the backdrop's stars, and the Figma mode has no pixel threshold to
  reuse. The reviewer reads the side-by-side, labelled Reference, and may
  read the diff.

A run that passes with `--review` saves the record as
`references/<page>/<frameId>/review.json`, sealed with a hash of the
review's inputs (`reviewSeal.ts`): the frame folder's files, the state
file that lists the frame, the page's stories, Storybook's config in
`web/.storybook/`, every repository file those import, transitively
(relative imports and `@bridge/shared` and `@bridge/contract`, so the
app frame, the rail, the tab bar and shared blocks count), and the
library version pinned in `pnpm-workspace.yaml`. Generated and ignored
files (`styled-system/`) and packages from `node_modules` are not
hashed; the library version stands for them. Commit it with the page.

`pnpm check:reviews` runs in `verify` and CI, which cannot run the
reviewer agent. It fails when a state lists a PNG frame's code and the
frame has no `review.json`, or when a `review.json`:

- has an inputs hash that is not the current one (`stale`): a reference,
  page or library change needs a new review and a new run;
- holds a record whose hash is not the saved one (`edited`);
- is for another frame, is not valid, or holds a P1 or P2 finding or an
  `unreviewable` verdict.

The hashes catch drift: a stale or hand-edited record. They are not a
signature, and do not stop tampering: anyone who can commit can also
recompute them.

`fidelity:check-build` and the `fidelity-builder` agent still need a
`frame.json`; they do not take a PNG frame.

## The fidelity-builder agent

`fidelity-builder` runs steps 1 to 4 and 6 for one frame in a worktree,
at most three fix rounds, and returns a JSON build record; the caller runs
step 5 with `fidelity-reviewer` on the record's side-by-side PNG and
deviations, then ships the branch. Both agents live in the owner's brain
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
  "position": [{ "layer": "task pane", "reason": "…" }, { "layer": "402:15340", "iconSize": 24, "reason": "…" }],
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
