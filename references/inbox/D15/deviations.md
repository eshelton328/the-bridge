# D15 deviations

What still differs from Figma after round 4 of the fidelity loop
(`pnpm fidelity inbox D15`, 2026-11-16, against the installed
library 1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

Updated on 2026-11-17 against the installed library 1.0.0-beta.7 (#107, #108) by
`pnpm fidelity inbox`, and again on 2026-11-17 against 1.0.0-beta.9 (#110, #111);
the checks and offsets below are from the beta.9 run.

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
  Figma's. Since library beta.86 (#269) the pressed toggle fills with
  `surface.discuss`, Figma's violet (#9e8fff at 0.3). Figma's label is
  violet too; it stays `fg.default`, as `accent.discuss` over the fill
  gives under 4.5:1. It is 32 px high (`md`), as
  Figma's.
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
- **Messages.** Erik's message is the library's `Message from="user"`;
  its text is `body` (14/20) where Figma's is 13/19, so a message that
  Figma fits on one line wraps to two here (`message · you` h +21 when
  it wraps). The discussion's reply is composed in the app: Figma puts a
  violet bubble before "Discussion", and `Message` draws only an agent's
  kind mark there (library gap). The name "Discussion" is
  `labelXsStrong` (SemiBold 12/16), as Figma's. Its text is `body` too,
  so it can wrap where Figma's does not (`message · discussion` h +21).
- **Proposal block.** The library's `ProposalBlock` with `ProposalDiff`,
  `ProposalSection` or checkboxes. Figma draws a spark icon before the
  eyebrow; the block has no icon slot (library gap). Its buttons are
  `sm` with `labelXs` labels (Medium 12/16), as Figma's (library
  beta.9).
- **Proposed update.** `ProposalBlock tone="update"` with the diff, Apply
  (primary, check), Discard and Edit first (pencil). It starts 46 px
  lower because the message and the reply above it wrap (see Messages).
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
- **Button labels.** Snooze, Dismiss and Discuss in the task bar, Reset
  and Edit in the prompt section and Change in the run card are
  `textSize="xs"` (`labelXs`, Medium 12/16), and Start is
  `textSize="smStrong"` (`labelSmStrong`, SemiBold 13/16), as Figma's.
  The proposal's buttons are Medium 12 too (see Proposal block).
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
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `message · discussion` x +0, y +25, w -1, h
  +21 (was x +0, y +25, w -1, h +25); `proposal · UPDATE THIS TASK` x
  +0, y +46, w +0, h +6 (was x +0, y +50, w +0, h +6). The cause is
  the discussion reply's author name in `labelXsStrong` (SemiBold
  12/16, Figma's; was `label`, Medium 14/20), a 4 px shorter line.
- **Beta.9 (2026-11-17).** Library 1.0.0-beta.9 (#110, #111) draws
  `ProposalBlock`'s own buttons (Apply, Discard, Edit first) in
  `labelXs` (Medium 12/16), as Figma's (was `label`, Medium 14/20). No
  layer of this frame moved.
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
- **Model and context label (2026-11-18).** "context" is `smallXs`
  (Geist Regular 11), 38 px wide as Figma's, not `monoSm` (46 px). The
  group is now within tolerance (was `model and context` w +6.4).
- **Compact discussion text (2026-11-18).** Erik's message is
  `Message size="sm"` and the reply's body `bodySm` (13/20, d-090), as
  Figma's Regular 13/19 (403:1442, 403:1444); they were `body` (14/20)
  and wrapped one more line. `message · you` passes (was h +21 px),
  `message · discussion` is y +5 px (was y +25, h +21) and
  `proposal · UPDATE THIS TASK` y +6, h +6 px (was y +46, h +6).

## Second review

The blind second review of round 3 (`reports/fidelity/inbox/D15.sideBySide.png`, Figma left) listed the findings below. Round 4 fixed or recorded each one.

- Composer at rest: fixed. The story's play test puts the focus in the composer, as Figma draws it (a caret). The focused border is the library's `border.selected` (cyan), where Figma draws a lighter grey border (LIBRARY_GAPS.md, row "Composer focus").
- Prompt wraps at other words: fixed. Its size was already Figma's: Geist Regular 13 (403:1855 in D16), the size of WHY. Figma breaks a line after a slash ("following toolkit/" then "rules/linear.md."), and a browser keeps a path whole, so every later line broke elsewhere. The prompt now has a `<wbr>` after each slash and breaks at Figma's words.
- Read the whole prompt, Undo, SOURCES links, MY NOTES text and placeholder, RUN IN title at 14 px: fixed with the Figma sizes. Read the whole prompt and Undo are Geist Medium 12 (`small` at the `label` weight), the source links Regular 12 (`small`; rows now 24 px apart, as Figma's y 776 and 800), the note and its placeholder Regular 13 (`bodySm`, `TextArea textSize="sm"`), and the RUN IN title Medium 13 (`labelSm`).
- Change and Start in the-bridge larger: recorded. Figma sets these labels in Geist Medium 12 (Start in SemiBold 13). `Button` draws its label in `label` (14) at every size, so `size="sm"` changes only the height. LIBRARY_GAPS.md, row "Button label size". Since beta.7 Change is `textSize="xs"` and Start `textSize="smStrong"`, Figma's (see Button labels).
- RUN IN card and notes box taller: in part. The RUN IN title and the notes are now 13 px; the card keeps the library `Panel` padding and `Button size="sm"` height (Section gaps above).

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
