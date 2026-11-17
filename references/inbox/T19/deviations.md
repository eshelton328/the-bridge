# T19 deviations

What still differs from Figma T19 · The task after Apply (`changeAppliedPage`, T18 after Apply), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 1 of 13 layers pass (`tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h -45; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h +2; 29 px removed: y -2.
- `title block`: x +2, y -27, w -4, h +4; 29 px removed: y +2.
- `section · WHY`: x +2, y -21, w -4, h +2; 29 px removed: y +8.
- `section · SUGGESTED PROMPT`: x +2, y -17, w -4, h -42; 29 px removed: y +12.
- `change history`: x -3.1, y -58, w -1.1, h +0; 29 px removed: y -29.
- `section · RUN IN`: x +2, y -57, w -4, h +1; 29 px removed: y -28.
- `start`: x +2, y -54, w -4, h -1; 29 px removed: y -25.
- `section · MY NOTES`: x +2, y -53, w -4, h +7; 29 px removed: y -24.
- `notes field`: x +2, y -51, w -4, h +5; 29 px removed: y -22.
- `section · SOURCES`: x +2, y -44, w -4, h +2; 29 px removed: y -15.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets above give the rest as "29 px removed". Measuring below the
  status bar is an open request to Erik. Library gap: Top and bottom
  safe areas on the tablet.
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
  `change history` (y -55 → -58) and `section · RUN IN` (y -54 → -57)
  start 3 px higher. The Recommended pill is now 20 px (`Badge
  size="sm"`, #106), as Figma's pills are, against 24 before, so the Run
  in card is 1 px taller than Figma's 85 (`section · RUN IN` h +5 → +1),
  and the layers below it start 7 px higher than before (`start` y -47 →
  -54, `section · MY NOTES` y -46 → -53, `notes field` y -44 → -51,
  `section · SOURCES` y -37 → -44; `task · next step` h -38 → -45).
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
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks disabled where Figma shows it enabled (P1): checked against the frames, and the rule stays. Figma draws Reset the same way in T2, T16 and T19 (and D1, D14 to D16): the label and icon in #8a97b8 (`fg.muted`) where Edit's are #e6ecff, with the same `border.default` border. So Figma dims Reset here too: after Apply, Undo on the change line takes the discussion's change back, and Reset stays for Erik's own edits, as in T2. The difference the review saw is the dim style: a disabled `Button` fades the whole button, border included, where Figma dims only the label and icon. `InboxRoute.test.tsx` checks that Reset is disabled in T19 after Apply, with Undo shown and no Edited pill. (Fixed by beta.5: a disabled secondary `Button` keeps its fill and `border.default` border and dims only its label and icon to `fg.muted`, as Figma draws Reset, #105.)
