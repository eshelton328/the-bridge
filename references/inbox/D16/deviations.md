# D16 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity inbox D16`, 2026-11-16, against the installed
library 1.0.0-beta.3), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the list's text, which the task pane covers in Figma, and the context meter's value are excepted in `exceptions.json` (one entry per string).
- Position: 5 of 18 layers pass (`task pane`, `task bar`, `title block`, `guard`, `composer · discussion`).
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
- **Messages.** Erik's message is the library's `Message from="user"`;
  its text is `body` (14/20) where Figma's is 13/19, so a message that
  Figma fits on one line wraps to two here (`message · you` h +21 when
  it wraps). The discussion's reply is composed in the app: Figma puts a
  violet bubble before "Discussion", and `Message` draws only an agent's
  kind mark there (library gap). Its text is `body` too, so it can wrap
  where Figma's does not (`message · discussion` h +25).
- **Proposal block.** The library's `ProposalBlock` with `ProposalDiff`,
  `ProposalSection` or checkboxes. Figma draws a spark icon before the
  eyebrow; the block has no icon slot (library gap). Its buttons are
  `sm`, as Figma's.
- **Applied update.** Figma turns the block green (border, eyebrow
  "APPLIED · UPDATE THIS TASK") and writes "Applied just now…" in mono
  with a check. `ProposalBlock` has no applied tone (library gap), so the
  block keeps the violet update tone and the line is its `note`
  (`small`, `fg.muted`, no check), with Undo.
- **New prompt.** Three lines in a box Figma keeps 128 px high (403:1854);
  the `Panel` hugs its text, so the box is 35 px shorter
  (`section · SUGGESTED PROMPT` h -35) and the sections below start
  higher (RUN IN y -21, start y -10, MY NOTES y -9). The change line
  ("Changed in a discussion · just now" and Undo) sits beside "Read the
  whole prompt", 16 px after it as in Figma; the link is 14 px text
  where Figma's is 13, so the line starts 21 px further right.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (in D16 the prompt has three lines).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: SOURCES y +9.
- **Detail inset.** The column starts at x 104 instead of 100 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

Not run by the builder; the coordinator runs the blind fidelity-reviewer
on `reports/fidelity/inbox/D16.sideBySide.png`.
