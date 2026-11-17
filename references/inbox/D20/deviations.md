# D20 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D20`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the list's text, which the task pane covers in Figma, and the context meter's value are excepted in `exceptions.json` (one entry per string).
- Position: 6 of 19 layers pass (`task pane`, `task bar`, `title block`, `guard`, `event`, `composer · discussion`).
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
  with no model chip, as Figma's. Its attach button is left out
  (LIBRARY_GAPS.md, Waiting for a design), and send adds the message to
  the discussion.
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
- **Event line.** "Created 3 tasks · …" in `monoSm` with a green check,
  as Figma's (`event` passes).
- **Proposed removal.** `ProposalBlock tone="remove"`: the struck-through
  title, the reason as `ProposalSection`, the note, Remove… as a
  `dangerSoft` button with a bin (the danger tint and border, as Figma draws it) and Keep it. 13 px lower and 8 px
  taller, from the messages above and the library's spacing.
- **Confirm dialog.** The library's `Dialog` (`role="alertdialog"`, 440
  px, `shell.dialog`) on its scrim: the meta line in `monoSm`, the text in
  `bodySm` and `fg.muted` (403:3918), the reason as an eyebrow and
  `bodySm` text in a `Panel` (403:3921), Keep it and a `danger` Remove
  task with a bin. It is 19 px taller and starts 9.5 px higher
  (`dialog · Remove this task`): the 20 px lines against Figma's 19, the
  panel's 16 px padding against 12 by 10, and the 14 px button labels.
  Keep it has the first focus and shows its focus ring (see Second
  review).
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (`section · SUGGESTED PROMPT` h +7).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +17, start y +28, MY NOTES y +29, SOURCES y +47.
- **Detail inset.** The column starts at x 104 instead of 100 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D20.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Keep it shows a focus ring: kept. The dialog gives Keep it the first focus, so a keyboard user starts on the safe action (the same choice as D08 Done); the library draws `:focus-visible` for it. Figma draws no ring.
- Composer at rest: recorded. The confirm dialog holds the focus while it is open, so the composer cannot show it as Figma draws it.
- REASON text smaller: fixed. The dialog's text and reason are Geist Regular 13/19 (403:3918, 403:3921): `bodySm`, the text in `fg.muted`. `ProposalSection` sets its text in `small` (12), the size of a proposal, so the dialog composes the eyebrow and the text in the `Panel` itself. The dialog is now 19 px taller (`dialog · Remove this task` h +19): `bodySm` lines are 20 px against 19 and the `Panel` pads 16 against Figma's 12 by 10.
- Read the whole prompt and SOURCES links larger: fixed. They are Figma's 12 px (Medium and Regular): `small`.
- Close X a bare X: no change needed. The render's close is the library's `Button size="sm" iconOnly`, a 28 px box with the raised fill, as in D14; under the scrim both look darker.
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
