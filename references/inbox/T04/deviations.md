# T04 deviations

What still differs from Figma T4 · Running, on the task page (the started task on its own page, `runningTaskPage`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, against the installed
library 1.0.0-beta.5, which has #104 to #106), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden Reset and Edit are excepted in `exceptions.json`.
- Position: 7 of 11 layers pass (`nav · back`, `task bar`, `title block`, `section · WHY`, `running`, `running card`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. The position check renders the page 29 px
shorter, below Figma's status bar, and adds 29 to each render y (d-101).

- `task · running`: x +2, y +4, w -4, h -13.
- `section · SUGGESTED PROMPT`: x +2, y +8, w -4, h -2.
- `section · MY NOTES`: x +2, y +8, w -4, h +7.
- `section · SOURCES`: x +2, y +17, w -4, h +2.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). The position check renders the page 29 px shorter and adds
  29 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 29 px
  lower, under a blank band where Figma has the bar. Library gap:
  Top and bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Detail spacing.** As in D01: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), and the prompt's 20 px lines against
  Figma's 21, so each section starts about 2 px lower than the one
  above it. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4); 12 px under it puts the task bar 40 px below
  the row's top against Figma's 42.
- **What beta.5 changed.** The sent prompt is now five 20 px
  `bodySm` lines (100 px) where it was 105: the faded `Clamp` cuts by
  height (#104), so the prompt's text style moved from an inline span,
  whose 13 px text in the panel's 14 px line made 21 px lines, onto a
  block. Figma's lines are 21, which no token has. The prompt section is
  now within the tolerance (h +3 to -2) and the task 5 px shorter
  (`task · running` h -8 to -13), so MY NOTES and SOURCES move up 5 px,
  closer to Figma's y, and still sit lower by the section spacing
  above (`section · MY NOTES` y +8, `section · SOURCES` y +17).
- **Run card.** The run card stays at the bottom of the screen above
  the tab bar, on the chrome with a top border (`running`, `running card`
  pass).
- **Hidden Figma text.** Figma keeps Reset and Edit as hidden layers in
  the SENT PROMPT header (346:6202, 346:6207); `exceptions.json` lists
  them, as D06 does.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Snooze, Dismiss and the run card's buttons keep
  the 14 px `label`; Figma sets them in Medium 12, which no text style
  has (d-050), so they are a little wider. Library gap: Button label
  size.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- The SENT PROMPT card's fifth line is not faded: stays. `Clamp` fades
  only a text it cuts, and the prompt's five lines hold all of it (the sheet in
  T8 shows the same whole text); Figma fades its fifth line anyway. The
  same holds in D01 to D21. (Since beta.5 a cut prompt fades with no
  ellipsis, #104.)
- MY NOTES card about 9 px taller: fixed in part. The note and its
  author now sit 24 px apart (Figma 25) instead of following the
  panel's 8 px gap under a 20 px line; the section is 7 px taller
  (`section · MY NOTES` h +7, was +11): the note's 20 px line against
  19, the author's 16 against 14 and the panel's 12 px padding against
  11 (4 px grid, d-072).
- "Inbox" in Back slightly larger: stays. `BackRow` draws its label in
  `labelLg` (16 px); Figma's 15 merges into 16 (d-072, as the sheet's
  Done in T8).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.

`section · SOURCES` fails on the section spacing above it (y +17,
measured below Figma's status bar, d-101). The 4 px shorter MY NOTES
card and beta.5's 5 px shorter prompt each moved it closer to Figma's y.

## Disabled controls

- **Open in Workspaces.** Disabled: the Workspaces page is not built and
  no Inbox frame draws where the button goes, so it waits for a design
  (LIBRARY_GAPS.md, Waiting for a design). It has `aria-disabled` and the
  title "Workspaces is not built yet", keeps the focus and does nothing on
  a press (`InboxRoute.test.tsx`). Since beta.5 (#105) a disabled
  `secondary` Button keeps its fill and border and draws its label and
  icon in `fg.muted`, where Figma draws it enabled with a brighter
  label.
