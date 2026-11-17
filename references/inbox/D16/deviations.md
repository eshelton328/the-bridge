# D16 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D16`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
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
  the `Panel` hugs its text, and 128 is no size token, so the section is
  39 px shorter (`section · SUGGESTED PROMPT` h -39) and the sections
  below start higher (RUN IN y -25, start y -14, MY NOTES y -13). Round 4
  made the links under the box 4 px shorter (12 px text), which adds 4
  to these offsets. The change line ("Changed in a discussion · just
  now" and Undo) sits beside "Read the whole prompt", 16 px after it, as
  in Figma, and now starts at Figma's x (`change history` y -26 only).
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21 px
  apart and its mono boxes 14 px high; the library keeps 20 and 16 (4 px
  grid). The prompt's five lines hold all of it, so it does not fade where
  Figma fades its fifth line (in D16 the prompt has three lines).
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: SOURCES y +5.
- **Detail inset.** The column starts at x 104 instead of 100 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D16.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Composer at rest: fixed. The story's play test puts the focus in the composer, as Figma draws it (a caret). The focused border is the library's `border.selected` (cyan), where Figma draws a lighter grey border (LIBRARY_GAPS.md, row "Composer focus").
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Change button larger and 25 px high: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size".
- SOURCES links larger, 24 px apart: fixed with `small`; the rows are now 24 px apart, as Figma's 403:1901 and 403:1909 (y 776 and 800).
- Undo on the change line larger: fixed. It is Geist Medium 12 (403:1980), `small` at the `label` weight.
