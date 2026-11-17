# T16 deviations

What still differs from Figma T16 · Discuss, on the task page (`discussTask`, T2 with the task's discussion), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 4 of 12 layers pass (`nav · back`, `task bar`, `title block`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y +4, w -4, h -5.
- `section · WHY`: x +2, y +8, w -4, h +2.
- `section · SUGGESTED PROMPT`: x +2, y +12, w -4, h -2.
- `section · RUN IN`: x +2, y +12, w -4, h +1.
- `start`: x +2, y +15, w -4, h -1.
- `section · MY NOTES`: x +2, y +16, w -4, h +7.
- `notes field`: x +2, y +18, w -4, h +5.
- `section · SOURCES`: x +2, y +25, w -4, h +2.

## Deviations

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
- **Offsets exposed by beta.5.** Two Figma-matching changes made the
  detail 9 px shorter (`task · next step` h +4 → -5). The prompt now sits
  in five 20 px `bodySm` lines: the faded `Clamp` cuts by height (#104),
  so the prompt's text style moved from an inline span, whose 13 px text
  in the panel's 14 px line made 21 px lines, onto a block. Figma's lines
  are 21, which no token has; the prompt section box is now within the
  tolerance (`section · SUGGESTED PROMPT` h +3 → -2), and `section · RUN
  IN` starts 5 px higher than before (now y +12). The Recommended pill
  is now 20 px (`Badge size="sm"`, #106), as Figma's pills are,
  against 24 before, so the Run in card is 1 px taller than Figma's 85
  (h +5 → +1), and the
  layers below it start 9 px higher than before (now `start` y +15,
  `section · MY NOTES` y +16, `notes field` y +18, `section · SOURCES`
  y +25).
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
