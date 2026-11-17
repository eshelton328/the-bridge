# T16 deviations

What still differs from Figma T16 · Discuss, on the task page (`discussTask`, T2 with the task's discussion), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 2 of 12 layers pass (`section · SOURCES`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h -5; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h +2; 29 px removed: y -2.
- `title block`: x +2, y -27, w -4, h +4; 29 px removed: y +2.
- `section · WHY`: x +2, y -21, w -4, h +2; 29 px removed: y +8.
- `section · SUGGESTED PROMPT`: x +2, y -17, w -4, h -2; 29 px removed: y +12.
- `section · RUN IN`: x +2, y -17, w -4, h +1; 29 px removed: y +12.
- `start`: x +2, y -14, w -4, h -1; 29 px removed: y +15.
- `section · MY NOTES`: x +2, y -13, w -4, h +7; 29 px removed: y +16.
- `notes field`: x +2, y -11, w -4, h +5; 29 px removed: y +18.

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
- **Offsets exposed by beta.5.** Two Figma-matching changes made the
  detail 9 px shorter (`task · next step` h +4 → -5). The prompt now sits
  in five 20 px `bodySm` lines: the faded `Clamp` cuts by height (#104),
  so the prompt's text style moved from an inline span, whose 13 px text
  in the panel's 14 px line made 21 px lines, onto a block. Figma's lines
  are 21, which no token has; the prompt section box is now within the
  tolerance (`section · SUGGESTED PROMPT` h +3 → -2), and `section · RUN
  IN` starts 5 px higher (y -12 → -17). The Recommended pill is now 20 px
  (`Badge size="sm"`, #106), as Figma's pills are, against 24 before, so
  the Run in card is 1 px taller than Figma's 85 (h +5 → +1), and the
  layers below it start 9 px higher than before (`start` y -5 → -14,
  `section · MY NOTES` y -4 → -13, `notes field` y -2 → -11);
  `section · SOURCES` (y +5 before) now passes.
- **Discuss.** Figma draws Discuss in violet (402:11096); the
  library has no discuss toggle, so it is a secondary `Button`, 32 px
  high against Figma's 30 (`task bar` h +2). Library gap: Discuss
  toggle.
- **My notes.** With no note yet, the notes are a 1-row `TextArea`
  (`notes field`), 5 px taller than Figma's 39 px field.
- **Behaviour.** Discuss opens the discussion's page (T17); Back
  ("Task") returns here. `InboxRoute.test.tsx` checks both at 756 px.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150. The bar itself (`tab bar`) is in place. Library gap: Tablet tab
  bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so the buttons are a
  little wider. Library gap: Button label size.

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks disabled where Figma shows it enabled (P1): checked against the frames, and the rule stays. Figma draws Reset the same way in T2, T16 and T19 (and D1, D14 to D16): the label and icon in #8a97b8 (`fg.muted`) where Edit's are #e6ecff, with the same `border.default` border. So Figma dims Reset here too: T16 is T2 with Discuss, and its prompt is the suggestion, so Reset has nothing to bring back. The difference the review saw is the dim style: a disabled `Button` fades the whole button, border included, where Figma dims only the label and icon. `InboxRoute.test.tsx` checks that Reset is disabled in T2's task page. (Fixed by beta.5: a disabled secondary `Button` keeps its fill and `border.default` border and dims only its label and icon to `fg.muted`, as Figma draws Reset, #105.)
- Prompt's last line not faded (P2): stays, as in T2: `Clamp` fades only text it cuts. (Since beta.5 a cut prompt ends with no ellipsis, #104.)
