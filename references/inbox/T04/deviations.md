# T04 deviations

What still differs from Figma T4 · Running, on the task page (the started task on its own page, `runningTaskPage`), after the last
fidelity run (`pnpm fidelity inbox T04`, 2026-11-17, library
1.0.0-beta.4), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass; the hidden Reset and Edit are excepted in `exceptions.json`.
- Position: 3 of 11 layers pass (`running`, `running card`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px; "29 px removed" is the y offset without the
status bar.

- `nav · back`: x +2, y -29, w -4, h -4; 29 px removed: y +0.
- `task · running`: x +2, y -25, w -4, h -8; 29 px removed: y +4.
- `task bar`: x +2, y -31, w -4, h -2; 29 px removed: y -2.
- `title block`: x +2, y -31, w -4, h +4; 29 px removed: y -2.
- `section · WHY`: x +2, y -25, w -4, h +2; 29 px removed: y +4.
- `section · SUGGESTED PROMPT`: x +2, y -21, w -4, h +3; 29 px removed: y +8.
- `section · MY NOTES`: x +2, y -16, w -4, h +7; 29 px removed: y +13.
- `section · SOURCES`: x +2, y -7, w -4, h +2; 29 px removed: y +22.

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
- **Button labels.** Button labels are 14 px (`label`) at every size;
  Figma sets small buttons in Medium 12 or 13, so Snooze, Dismiss,
  Newest, Filter and the row actions are a little wider. Library gap:
  Button label size.

## Second review

A separate agent compared `frame.png` with the render, blind to how it
was built (2026-11-17). Each finding, fixed or with why it stays:

- The SENT PROMPT card's fifth line is not faded: stays. `Clamp` fades
  only a text it cuts, and the prompt's five lines hold all of it (the sheet in
  T8 shows the same whole text); Figma fades its fifth line anyway. The
  same holds in D01 to D21.
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

`section · SOURCES` failed only by moving up: the MY NOTES card is 4 px
shorter, and the status bar's -29 no longer cancels the layout's +26.
