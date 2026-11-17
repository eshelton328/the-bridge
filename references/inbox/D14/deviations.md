# D14 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D14`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
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
  `subtitle`, the text in `bodySm` and `fg.muted` in a 420 px column
  (`shell.widePane`), as Figma's 403:967 (Regular 13/19, w 420), "It can"
  as a `Panel` with its eyebrow title, and the suggestions as `Button`s.
  Figma places it with 120 px above it (403:962 starts at y 140, its icon
  at 260); no spacing token is that large, so the render centres it in
  the discussion area, about 100 px lower (`empty state` y +207 against
  the frame's box, `it can` y +94, `suggestions` y +96). The suggestion
  buttons are `md` with Figma's Medium 12 labels (`small` at the `label`
  weight on the `Button`), so the three buttons span about 518 px against
  Figma's 507 and stay on one row; the `suggestions` box itself spans the
  587 px column (w +80). With the Button's own 14 px labels the buttons
  filled the column and wrapped on Linux, where glyph widths round up
  (row "Button label size" in LIBRARY_GAPS.md).
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

The blind second review of round 3 (`reports/fidelity/inbox/D14.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Composer at rest: fixed. The story's play test puts the focus in the composer, as Figma draws it (a caret). The focused border is the library's `border.selected` (cyan), where Figma draws a lighter grey border (LIBRARY_GAPS.md, row "Composer focus").
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Empty-state text wider (2 lines against 3): fixed. It is `bodySm` (Figma 403:967: Regular 13/19) in a 420 px column (`maxW: shell.widePane`, the 420 px size token), so it wraps at Figma's words in three lines.
- Task title smaller: recorded. Figma's title is Geist SemiBold 22/28 (403:1809). No text style has 22 px (`title` is 20, `heading` 28), so the title is in `title`. LIBRARY_GAPS.md, row "22 px title".
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Change, Reset, Edit and Start in the-bridge larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size".
- Rail items further apart: recorded. The library `NavRail` items are 54 px high and 60 px apart against Figma's 50 and 56 (More y 241 against 233). D01 to D12 render the same rail. LIBRARY_GAPS.md, row "Rail item height".
