# T19 deviations

What still differs from Figma T19 · The task after Apply (`changeAppliedPage`, T18 after Apply), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 4 of 19 layers pass (`nav · back`, `task bar`, `title block`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y -2, w -4, h -9.
- `section · WHY`: x +2, y +6, w -4, h +2.
- `section · SUGGESTED PROMPT`: x +2, y +10, w -4, h -42.
- `change history`: x -3.1, y -31, w -1.1, h +0.
- `section · RUN IN`: x +2, y -30, w -4, h +1.
- `start`: x +2, y -27, w -4, h -1.
- `section · MY NOTES`: x +2, y -26, w -4, h +7.
- `notes field`: x +2, y -24, w -4, h +5.
- `section · SOURCES`: x +2, y -17, w -4, h +2.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 6` (read with `use_figma`, T2 346:5683, T3 346:5911, T4 346:6144), so it ends 28 px under its last section. The build now pads the task the same way: 6 at the top (the Back row's margin is 6, not 12, so the task bar stays 40 under the row's top) and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). `task · next step` is h -9: the padding adds 38 px to it, and the prompt section is still 42 px shorter than Figma's (below).
- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 29 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Detail spacing.** As in T02: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), and the prompt's 20 px lines against
  Figma's 21, so each section starts about 2 px lower than the one
  above it. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4). Library gap: Small text in the detail.
- **Offsets exposed by beta.5.** Two Figma-matching changes moved the
  lower layers up. The prompt's three lines are 20 px `bodySm` lines on a
  block now: the faded `Clamp` cuts by height (#104), so the text style
  moved off an inline span, whose 13 px text in the panel's 14 px line
  made 21 px lines (Figma's line height, which no token has). The prompt
  box is 3 px shorter (`section · SUGGESTED PROMPT` h -39 → -42), so
  `change history` and `section · RUN IN` start 3 px higher than before
  (now y -29 and y -28). The Recommended pill is now 20 px (`Badge
  size="sm"`, #106), as Figma's pills are, against 24 before, so the Run
  in card is 1 px taller than Figma's 85 (`section · RUN IN` h +5 → +1),
  and the layers below it start 7 px higher than before (now `start` y
  -25, `section · MY NOTES` y -24, `notes field` y -22, `section ·
  SOURCES` y -15; `task · next step` h -38 → -45).
- **Discuss.** Figma draws Discuss in violet (402:11096 in T16); the
  library has no discuss toggle, so it is a secondary `Button`, 32 px
  high against Figma's 30 (`task bar` h +2). Library gap: Discuss
  toggle.
- **My notes.** With no note yet, the notes are a 1-row `TextArea`
  (`notes field`), 5 px taller than Figma's 39 px field.
- **Changed prompt.** The prompt box hugs the three lines of the new
  prompt (`Clamp` sets a maximum of five lines, not a height), so the
  box is 42 px shorter than Figma's, which keeps the five-line height
  of the old prompt (`section · SUGGESTED PROMPT` h -42). Every section
  below it starts higher by that much. The change line ("Changed in a
  discussion · just now" with Undo) is in place beside Read the whole
  prompt (`change history`), and Undo takes the change back.
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Button labels.** Discuss, Snooze, Dismiss, Reset, Edit and Change
  take `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's
  Medium 12, and Start takes `textSize="smStrong"` (`labelSmStrong`,
  SemiBold 13/16), Figma's SemiBold 13 (d-100). The labels match
  Figma's.
- **Kept prompt box (2026-11-18).** The applied prompt's `Clamp` takes
  `reserve`, as in D16: `section · SUGGESTED PROMPT` is y +10 px (was
  y +10, h -42), and the sections under it move from y -17 to -31 px to
  y +9 to +23 px. `task · next step` is now h +31 px (was h -9): the
  task runs on under the page's end, and Figma's frame stops at the
  viewport.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks disabled where Figma shows it enabled (P1): checked against the frames, and the rule stays. Figma draws Reset the same way in T2, T16 and T19 (and D1, D14 to D16): the label and icon in #8a97b8 (`fg.muted`) where Edit's are #e6ecff, with the same `border.default` border. So Figma dims Reset here too: after Apply, Undo on the change line takes the discussion's change back, and Reset stays for Erik's own edits, as in T2. The difference the review saw is the dim style: a disabled `Button` fades the whole button, border included, where Figma dims only the label and icon. The Inbox route tests check that Reset is disabled in T19 after Apply, with Undo shown and no Edited pill. (Fixed by beta.5: a disabled secondary `Button` keeps its fill and `border.default` border and dims only its label and icon to `fg.muted`, as Figma draws Reset, #105.)
