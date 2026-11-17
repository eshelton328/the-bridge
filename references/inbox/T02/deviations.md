# T02 deviations

What still differs from Figma T2 · A next step (the next step on its own page, `taskPage`), after the last
fidelity run (`pnpm fidelity inbox T02`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass.
- Position: 2 of 12 layers pass (`section · SOURCES`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · next step`: x +2, y -25, w -4, h +0; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h -2; 29 px removed: y -2.
- `title block`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `section · WHY`: x +2, y -25, w -4, h +2; 29 px removed: y +4.
- `section · SUGGESTED PROMPT`: x +2, y -21, w -4, h +3; 29 px removed: y +8.
- `section · RUN IN`: x +2, y -16, w -4, h +5; 29 px removed: y +13.
- `start`: x +2, y -9, w -4, h -1; 29 px removed: y +20.
- `section · MY NOTES`: x +2, y -8, w -4, h +7; 29 px removed: y +21.
- `notes field`: x +2, y -6, w -4, h +5; 29 px removed: y +23.

## Deviations

- **Status bar.** Figma draws a 29 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas), so the render starts at y 0 and every layer anchored to the
  top is about 29 px higher (`y -29`). The position check measures from
  the frame's top, so these layers fail by the status bar alone; the
  offsets below give the rest as "29 px removed". Library gap: Top and
  bottom safe areas on the tablet.
- **Side inset.** `Container size="tablet"` pads 24 against Figma's 22,
  so every full-width layer is `x +2, w -4` (within the tolerance).
- **Detail spacing.** As in D01: sections are 24 px apart against
  Figma's 22 (no 22 token, d-072), and the prompt's 20 px lines against
  Figma's 21, so each section starts about 2 px lower than the one
  above it. The title is `title` (20/28) against Figma's 22 px
  (library gap: 22 px title). `BackRow` is 28 px high against Figma's
  32 (`nav · back` h -4); 12 px under it puts the task bar 40 px below
  the row's top against Figma's 42.
- **My notes.** With no note yet, the notes are a 1-row `TextArea`
  (`notes field`), 5 px taller than Figma's 39 px field.
- **Tab bar.** `TabBar` spreads its five tabs over the full width
  (about 148 px each, Home at x 8); Figma centres five 91 px tabs from
  x 150 (346:5574). The bar itself (`tab bar`) is in place. Library gap:
  Tablet tab bar.
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so Snooze, Dismiss,
  Newest, Filter and the row actions are a little wider. Library gap:
  Button label size.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- Reset looks enabled where Figma dims it: fixed. Reset brings back
  the suggested prompt, so it is disabled until Erik edits the prompt
  (`prompt.edited`), as Figma draws it (346:5736).
- The prompt's fifth line is not faded: stays. `Clamp` fades only a
  text it cuts, and the prompt's five lines hold all of it (the sheet in
  T8 shows the same whole text); Figma fades its fifth line anyway. The
  same holds in D01 to D21.
- Run in card lines 25 px apart and the card 68 px high against 20 and
  62: fixed in part. The detail line now follows the title row with no
  gap (title to detail 20 px, Figma 21.5). The card is still 5 px
  taller (`section · RUN IN` h +5): the Recommended pill is 24 px high
  against Figma's 20 (library gap: Pill height).
- "Opens the new chat and sends the prompt." lighter than Figma's:
  stays. It is `fg.subtle` #7986a6 against Figma's #4a5675 (d-055).
- Back did not return to the list (caller's review). Fixed: Back closes
  the open item through the page store (`inboxStore` `setItemOpen`), so
  the list shows; `InboxRoute.test.tsx` checks it at the tablet width.

`section · SOURCES` passes only because its layout offset (+30) and the
missing status bar (-29) cancel; the Run in card and the start row,
4 px shorter now, moved it up.
