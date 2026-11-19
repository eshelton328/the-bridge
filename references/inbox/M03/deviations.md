# M03 deviations

What still differs from Figma M3 · Edit the prompt (the prompt in its editor with the keyboard, `promptKeyboard`), after the last
fidelity run (`pnpm fidelity inbox M03`, 2026-11-17, library
1.0.0-beta.4; updated on 2026-11-17 from `pnpm fidelity inbox` of all 70 frames against
the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (14 strings checked; 14 Figma strings under exceptions.json).
- Position: 2 of 7 layers pass (`nav`, `scrolled title`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `task · next step`: x +0, y -2, w +0, h +56.
- `section · SUGGESTED PROMPT`: x +0, y -1, w +0, h -14.
- `section · RUN IN`: x +0, y -13, w +0, h -21.
- `button · Change`: x +0, y -24.5, w -2, h +4.
- `section · SOURCES`: x +0, y -189, w +0, h +2.

## Deviations

- **Task frame padding (step 13).** Figma's task frame is a hug Auto Layout frame with `paddingBottom: 28` and `paddingTop: 8` (read with `use_figma`, M2 346:9246, M5 346:9866), so it ends 28 px under its last section. The build now pads the task the same way: 8 at the top, as before, and 32 at the bottom (28 has no spacing token; a tie takes the larger, d-072). The padding makes `task · next step` 32 px taller (h +56); the other reasons for its height are below.
- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **Keyboard.** Figma draws the iOS keyboard over the bottom of the
  screen (design chrome, d-089, excluded from the text check); the app
  draws none. While the editor is open on the phone the render hides
  the tab bar, Start and My notes, which the keyboard covers, and shows
  the title on one line over the prompt instead of the head and Why
  (`scrolled title`), as Figma does. Sources, which Figma keeps hidden
  under the keyboard (346:9508), shows below Run in (`section ·
  SOURCES` y -187), and the task frame ends there (`task · next
  step` h +24).
- **Nav.** As in M2: the nav is 32 px against 40 (`nav` h -8).
- **Editor.** Edit puts the focus in the editor (`InboxPhone.test.tsx`),
  and the story focuses it, so it has Figma's focus border and a caret.
  The editor is 14 px shorter (`section · SUGGESTED PROMPT` h -14):
  `TextArea textSize="sm"` pads 8 with 20 px lines. Library gap: Small
  text in the detail.
- **Spacing.** The scrolled title, the prompt and Run in are 20 apart
  against Figma's 18 (d-072: a tie takes the larger token), so the
  prompt starts 1 px lower than Figma's (`section · SUGGESTED PROMPT`
  y +1). The editor is 14 px shorter, so Run in starts 11 px higher
  (`section · RUN IN` y -11, `button · Change` y -22.5). With 24 px
  gaps Run in started 3 px higher, but each gap was 6 px larger than
  Figma's.
- **Run in card.** As in M2: the pill beside the title makes the card
  21 px shorter (`section · RUN IN` h -21), and Change is 28 × 28
  against 30 × 24 (`button · Change`). Library gap: Small icon button.
  The Recommended and Edited pills are now 20 px high, as Figma's
  (`Badge size="sm"`, #106); at 24 px the Recommended pill's extra 4 px
  hid part of the card's offset (h -17 before), and with the shorter
  card Change moved 2 px up and Sources 4 px up.
- **Hidden layers.** M3 keeps the task bar, title block and Why as
  hidden layers at y 94; the exceptions say why their text is not
  checked. The title's exception names the visible scrolled title
  (346:9435) as well as the hidden one (346:9442), so the scrolled
  title is not checked either; the render shows it.
- **Button labels.** Reset and Done (Edit while the editor is closed)
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Change is an icon. The labels match.
