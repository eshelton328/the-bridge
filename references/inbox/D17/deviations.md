# D17 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D17`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.5 (#104 to #106) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; the list's text, which the task pane covers in Figma, and the context meter's value are excepted in `exceptions.json` (one entry per string).
- Position: 6 of 17 layers pass (`task pane`, `task bar`, `title block`, `guard`, `message · you`, `composer · discussion`).
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
- **New tasks.** Each task is a bordered box (`border.default`, radius
  `lg`, 8 by 10 padding) with a `Checkbox` and the meta line under the
  title; in a `Panel` each box was 12 px taller (round 1). The `Checkbox` label is `body`
  (14/20) where Figma's title is 13/17, and "Also remove this task" is a `size="sm"`
  `Checkbox` too, so the block is 60 px taller
  (`proposal · CREATE 3 TASKS` h +60). Create 3 tasks counts the checked
  tasks.
- **Detail text.** WHY and the prompt use `bodySm` (13/20), and the mono
  lines `monoSm` (11/16), as in D01 to D12. Figma's prompt lines are 21
  px apart and its mono boxes 14 px high; the library keeps 20 and 16 (4
  px grid). The prompt's five lines hold all of it, so it does not fade
  where Figma fades its fifth line (`section · SUGGESTED PROMPT` h -2).
  Since beta.5 the prompt's `bodySm` sits on a block around `Clamp`, not
  on an inline span: there its 13 px text in the panel's 14 px line made
  21 px lines, and the faded `Clamp` (#104), which now cuts at five
  lines' height with no ellipsis, would hide the fifth. Five 20 px lines
  are 100 px, not 105, so the prompt is 5 px shorter and the layers
  below it 5 px higher.
- **Section gaps.** Sections are 24 px apart against Figma's 22; 22 has
  no spacing token and ties go to the larger (d-072). With the taller
  notes box (16 px, the `TextArea` field) the sections below WHY start
  lower: RUN IN y +12, start y +15, MY NOTES y +16, SOURCES y +30.
- **Detail inset.** The column starts at x 104 instead of 100 (`Container
  size="detail"` pads 40 where Figma has 36, d-072 tie). Within the 4 px
  tolerance.
- **Beta.5 (2026-11-17).** The new library parts move these layers:
  `section · MY NOTES` x +4, y +16, h +12 (was x +4, y +25, h +12);
  `section · RUN IN` x +4, y +12, h +1 (was x +4, y +17, h +5);
  `section · SOURCES` x +4, y +30, h +2 (was x +4, y +39, h +2);
  `section · SUGGESTED PROMPT` x +4, y +12, h -2 (was x +4, y +12, h
  +3); `start` x +4, y +15, h -1 (was x +4, y +24, h -1). The cause is
  the 20 px pills (`Badge size="sm"`; Figma's pills are 20, beta.4 drew
  24) and the prompt's 20 px lines (see "Detail text").

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D17.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Composer at rest: fixed. The story's play test puts the focus in the composer, as Figma draws it (a caret). The focused border is the library's `border.selected` (cyan), where Figma draws a lighter grey border (LIBRARY_GAPS.md, row "Composer focus").
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Discuss, Snooze, Dismiss, Reset, Edit, Change and Start in the-bridge larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size".
- Rail items further apart: recorded. The library `NavRail` items are 54 px high and 60 px apart against Figma's 50 and 56 (More y 241 against 233). D01 to D12 render the same rail. LIBRARY_GAPS.md, row "Rail item height".
