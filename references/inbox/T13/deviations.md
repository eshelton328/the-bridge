# T13 deviations

What still differs from Figma T13 · Snooze or dismiss (the Snooze menu open on the task page, `snoozePage`, T2 `taskPage`), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (49 strings).
- Position: 5 of 19 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `task · next step`: x +2, y -2, w -4, h +27.
- `section · SUGGESTED PROMPT`: x +2, y +6, w -4, h -2.
- `section · RUN IN`: x +2, y +6, w -4, h +1.
- `start`: x +2, y +9, w -4, h -1.
- `section · MY NOTES`: x +2, y +10, w -4, h +7.
- `notes field`: x +2, y +12, w -4, h +5.
- `section · SOURCES`: x +2, y +19, w -4, h +2.
- `menu · Snooze or dismiss`: x +2, y -6, w +0, h +22.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 6` (read with `use_figma`, T2 346:5683, T3 346:5911, T4 346:6144), so it ends 28 px under its last section. The build now pads the task the same way: 6 at the top (the Back row's margin is 6, not 12, so the task bar stays 40 under the row's top) and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). `task · next step` h +27 is 4 px from the 32 against Figma's 28; the rest is the content's own excess: the sections are 24 apart against Figma's 22 (d-072), and the section labels and text lines are on the 4 px grid (16 against Figma's 14 and 17, d-100). Before, the missing padding hid that excess.
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
  Figma's 22 (no 22 token, d-072), so each section starts a little lower
  than the one above it. The title is `title` (20/28) against Figma's
  22 px (library gap: 22 px title). `BackRow` is 28 px high against
  Figma's 32 (`nav · back` h -4).
- **Offsets exposed by beta.5.** Two Figma-matching changes made the
  detail 9 px shorter (`task · next step` h -9). The prompt now sits in
  five 20 px `bodySm` lines: the faded `Clamp` cuts by height (#104), so
  the prompt's text style moved from an inline span, whose 13 px text in
  the panel's 14 px line made 21 px lines, onto a block. Figma's lines
  are 21, which no token has; the prompt section box is now within the
  tolerance (`section · SUGGESTED PROMPT` h +3 → -2), and `section · RUN
  IN` starts 5 px higher than before (now y +8). The Recommended pill is
  now 20 px (`Badge size="sm"`, #106), as Figma's pills are,
  against 24 before, so the Run in card is 1 px taller than Figma's 85
  (h +5 → +1), and the
  layers below it start 9 px higher than before (now `start` y +11,
  `section · MY NOTES` y +12, `notes field` y +14, `section · SOURCES`
  y +21).
- **Snooze menu.** As in D12: `Menu size="lg" width="md"` has
  Figma's 320 px width and 44 px rows, and its labels are `bodyLg`
  (Regular 15/24), Figma's Regular 15 (library #107). Its heading and
  separator make it 22 px taller (`menu · Snooze or dismiss` h +22). It
  opens under Snooze, within the tolerance across (x +2), since Snooze
  takes Figma's Medium 12 label.
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **Button labels.** Snooze, Dismiss, Reset, Edit and Change take
  `Button textSize="xs"` (`labelXs`, Medium 12/16), Figma's Medium 12,
  and Start takes `textSize="smStrong"` (`labelSmStrong`, SemiBold
  13/16), Figma's SemiBold 13 (d-100). The labels match Figma's.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108), with this branch's app changes, move these layers: `menu · Snooze or dismiss` x +2, y -6, w
  +0, h +22 (was x -5, y -6, w +0, h +22). The cause is Snooze and
  Dismiss in Medium 12 (`Button textSize="xs"`), so both buttons are
  narrower and the menu, placed at Snooze's end, moves with it.

## Second review

A separate agent compared the side-by-side picture with the render,
blind to how it was built (2026-11-17). Each finding, fixed or with why
it stays:

- The suggested prompt's last line not faded (F1): stays, as recorded on T02, T04 and T08: `Clamp` fades only a text it cuts, and the prompt's lines hold all of it. (Since beta.5 a cut prompt ends with no ellipsis, #104.)
- The MY NOTES field 5 px taller and its placeholder a little larger (F2): stays. `TextArea textSize="sm"` with one row is 44 px high against Figma's 39 (346:8502, `notes field` h +5); the field's padding and 20 px line are the library's, and Figma's 17 px placeholder line and 11 px inset have no token. Library gap: Panel and text field padding.
- The Snooze menu's times lighter than Figma's dim grey, and the check before Mark done dimmer than Figma's (F3): stays. The menu draws a time in `mono`, `fg.muted`, because `fg.subtle` (Figma's #4a5675) is not for `surface.overlay`, and every item icon in `fg.muted` (the menu recipe, D12). Library gap: Styles that differ from Figma.
