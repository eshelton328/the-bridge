# T16 deviations

What still differs from Figma T16 · Discuss, on the task page (`discussTask`, T2 with the task's discussion), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 4 of 18 layers pass (`nav · back`, `task bar`, `title block`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y -2, w -4, h +31.
- `section · WHY`: x +2, y +6, w -4, h +2.
- `section · SUGGESTED PROMPT`: x +2, y +10, w -4, h -2.
- `section · RUN IN`: x +2, y +10, w -4, h +1.
- `start`: x +2, y +13, w -4, h -1.
- `section · MY NOTES`: x +2, y +14, w -4, h +7.
- `notes field`: x +2, y +16, w -4, h +5.
- `section · SOURCES`: x +2, y +23, w -4, h +2.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 6` (read with `use_figma`, T2 346:5683, T3 346:5911, T4 346:6144), so it ends 28 px under its last section. The build now pads the task the same way: 6 at the top (the Back row's margin is 6, not 12, so the task bar stays 40 under the row's top) and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). `task · next step` h +31 is 4 px from the 32 against Figma's 28; the rest is the content's own excess: the sections are 24 apart against Figma's 22 (d-072), and the section labels and text lines are on the 4 px grid (16 against Figma's 14 and 17, d-100). Before, the missing padding hid that excess.
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
  ("Task") returns here. The Inbox route tests check both at 756 px.
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

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks disabled where Figma shows it enabled (P1): checked against the frames, and the rule stays. Figma draws Reset the same way in T2, T16 and T19 (and D1, D14 to D16): the label and icon in #8a97b8 (`fg.muted`) where Edit's are #e6ecff, with the same `border.default` border. So Figma dims Reset here too: T16 is T2 with Discuss, and its prompt is the suggestion, so Reset has nothing to bring back. The difference the review saw is the dim style: a disabled `Button` fades the whole button, border included, where Figma dims only the label and icon. The Inbox route tests check that Reset is disabled in T2's task page. (Fixed by beta.5: a disabled secondary `Button` keeps its fill and `border.default` border and dims only its label and icon to `fg.muted`, as Figma draws Reset, #105.)
- Prompt's last line not faded (P2): stays, as in T2: `Clamp` fades only text it cuts. (Since beta.5 a cut prompt ends with no ellipsis, #104.)
