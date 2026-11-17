# D14 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D14`, 2026-11-16, against the installed
library 1.0.0-beta.3), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the list's text, which the task pane covers in Figma, and the context meter's value are excepted in `exceptions.json` (one entry per string).
- Position: 5 of 17 layers pass (`task pane`, `task bar`, `title block`, `guard`, `composer · discussion`).
- Rules: pass.

## Deviations

- **Discuss button.** Figma draws Discuss in violet while the discussion
  is open (403:943). The library has no discuss toggle (its button recipe
  says it comes later), so it is a `pressed` secondary `Button`, which is
  cyan. It is 32 px high (`md`), as Figma's.
- **Discussion panel width.** Figma's panel (403:947) is 628 px wide,
  what is left beside an 820 px task. The task is `Container
  size="detail"` (748 + 2 × 40 = 828), so the panel starts 8 px further
  right (`discussion panel` x +8, w -8). No size token is 628 and
  `AppShell` has no side width for it (library gap). A 12 px start padding
  (20 at the end) keeps the panel's content at Figma's x 905, so the
  guard and the composer pass.
- **Model and context.** `ModelChip` with the model as its one option,
  `ContextMeter` and "context" in `monoSm`. The chip is 10 px wider than
  Figma's (`model and context` w +9.6): the library chip's own padding.
- **Discussion area.** 7 px shorter (`discussion` h -7): the composer
  below it is the library's `Composer`, a few px taller than Figma's 75,
  with the attach button and no model chip, as Figma's.
- **Task column.** The task's sections start 2 px lower than in D1
  (`section · WHY` y +8 against +6); the task bar now holds the 32 px
  Discuss button beside the 30 px Snooze and Dismiss.
- **Empty state.** The library has no empty state with an icon tile
  (`ErrorState` is for errors and not-found pages), so the app composes
  it: a round `surface.raised` tile with the bubble, the title in
  `subtitle`, the text in `body` and `fg.muted`, "It can" as a `Panel`
  with its eyebrow title, and the suggestions as `Button`s. Figma places
  it with 120 px above it (403:962 starts at y 140, its icon at 260); no
  spacing token is that large, so the render centres it in the
  discussion area, about 100 px lower (`empty state` y +217 against the frame's
  box, `it can` y +84, `suggestions` y +86). The suggestion buttons are
  `md` with 14 px labels against Figma's 13, so the row is 80 px wider.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +21, start y +32, MY NOTES y +33, SOURCES y +51.
- **Detail inset.** The column starts at x 104 instead of 100 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

Not run by the builder; the coordinator runs the blind fidelity-reviewer
on `reports/fidelity/inbox/D14.sideBySide.png`.
