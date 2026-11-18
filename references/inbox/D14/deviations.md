# D14 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D14`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`; the checks and offsets below are from that run.

## Checks

- Text: pass; the list's text, which the task pane covers in Figma, and the context meter's value are excepted in `exceptions.json` by their layer ids (one entry per string, d-101), so the same text in the task pane is still checked.
- Position: 8 of 23 layers pass (`task pane`, `task bar`, `title block`, `guard`, `composer · discussion`).
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces` and `rail · Projects`.
- Rules: pass.

## Deviations

- **Discuss button.** Figma draws Discuss in violet while the discussion
  is open (403:943): a 50 % violet border (`border.discuss`) over a violet
  fill. Since library beta.36 (#138) the `pressed` secondary `Button` takes
  `pressedBorder="discuss"`, so its border is `accent.discuss`, the solid
  violet: the 50 % violet over the pressed fill gives only 2.26:1 to
  2.93:1, under the 3:1 of WCAG 1.4.11, so the border is stronger than
  Figma's. The fill stays `surface.selected`; no token has Figma's violet
  fill (LIBRARY_GAPS.md: Discuss toggle). It is 32 px high (`md`), as
  Figma's, and its label is Medium 12 (`Button textSize="xs"`,
  `labelXs`), as Figma's.
- **Discussion panel width.** Figma's panel (403:947) is 628 px wide,
  what is left beside an 820 px task. The task is `Container
  size="detail"` (748 + 2 × 40 = 828), so the panel starts 8 px further
  right (`discussion panel` x +8, w -8). No size token is 628 and
  `AppShell` has no side width for it (library gap). A 12 px start padding
  (20 at the end) keeps the panel's content at Figma's x 905, so the
  guard and the composer pass.
- **Model and context.** `ModelChip` with the model as its one option,
  `ContextMeter` and "context" in `monoSm`. The chip is 10 px wider than
  Figma's (`model and context` w +6.4 with library beta.15): the library chip's own padding.
- **Discussion area.** 7 px shorter (`discussion` h -7): the composer
  below it is the library's `Composer`, a few px taller than Figma's 75,
  with no model chip, as Figma's. Its attach button is left out
  (LIBRARY_GAPS.md, Waiting for a design), and send adds the message to
  the discussion.
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
  buttons are `md` with Figma's Medium 12 labels (`Button
  textSize="xs"`, `labelXs`, Medium 12/16; before beta.7 the app drew
  `small` at the `label` weight, the same 12/16 Medium), so the three buttons span about 518 px against
  Figma's 507 and stay on one row; the `suggestions` box itself spans the
  587 px column (w +80). With the Button's own 14 px labels the buttons
  filled the column and wrapped on Linux, where glyph widths round up.
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
- **Nav rail.** Figma's rail has no Artifacts or Toolkit item, so
  `rail · Artifacts` and `rail · Toolkit` have no layer, and
  `rail · More` sits 108 px lower (y +108). The design predates d-105,
  which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Notes box (2026-11-18).** The note card is now the `notice`
  `Panel` (10 px at the top and bottom, 12 at the sides), as Figma's
  notes card (D1 346:404), not the `section` one (12 and 16). The note,
  its author and the "Add a note…" field are one `Stack` 4 apart, so
  they start 24 and 20 px apart (Figma 25 and 20). The card is 8 px
  shorter: `section · MY NOTES` y +14 px (was y +14, h +12 px); `section · SOURCES` y +20 px (was y +28 px). The y offsets that stay come from the section
  gaps and line heights above (4 px grid, d-072, d-100).

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D14.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Composer at rest: fixed. The story's play test puts the focus in the composer, as Figma draws it (a caret). The focused border is the library's `border.selected` (cyan), where Figma draws a lighter grey border (LIBRARY_GAPS.md, row "Composer focus").
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Empty-state text wider (2 lines against 3): fixed. It is `bodySm` (Figma 403:967: Regular 13/19) in a 420 px column (`maxW: shell.widePane`, the 420 px size token), so it wraps at Figma's words in three lines.
- Task title smaller: recorded. Figma's title is Geist SemiBold 22/28 (403:1809). No text style has 22 px (`title` is 20, `heading` 28), so the title is in `title`. LIBRARY_GAPS.md, row "22 px title".
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Change, Reset, Edit and Start in the-bridge larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size". Fixed by beta.7: Change, Reset and Edit take `Button textSize="xs"` (`labelXs`, Medium 12/16) and Start `textSize="smStrong"` (`labelSmStrong`, SemiBold 13/16), as Figma's.
- Rail items: library #115 (beta.14) closed the gap. `NavRail` items are 50 px high and 56 px apart, as Figma's.
