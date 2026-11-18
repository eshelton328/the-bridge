# M06 deviations

What still differs from Figma M6 · Subagents (bridge themes' subagents on
the phone, `phoneSubagents`), after the last fidelity run (`pnpm fidelity
workspaces M06`, 2026-11-17, library 1.0.0-beta.27), each with its reason.
The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`. The
screen is `PhoneSubagents` in the phone's detail with no tab bar: `BackRow`
to the chat, `PageHeader size="phone"` and the count line in a
`ScrollFrame` header, over D3's `SubagentCard`s with `size="phone"` and a
chevron each.

## Checks

- Text: pass. Every Figma string shows.
- Position: fail, 4 of 10 layers pass: the header (`105:3176`), the title
  (`105:3181`), the count line (`105:3185`) and the first card
  (`105:3187`). Six fail:
  - `105:3177` (the back row): w +29.8, h +11.
  - `147:15` (the first card's chevron): x -8.
  - `105:3200` (the Layout notes card): y +5.
  - `147:17` (its chevron): x -8, y +5.
  - `105:3223` (the theme tokens subtask card): y +9.
  - `147:19` (its chevron): x -8, y +9.
- Rules: pass.

## Deviations

- **The back row is larger (Phone back row), `105:3177` w +29.8, h +11.**
  Figma's back row is 17 high with a 16 px chevron and the chat's name in
  Regular 14. `BackRow` is 28 high with a 20 px chevron and the name in
  16 px Medium, so "bridge themes" is larger and the row starts at the
  header's top, 4 px higher than Figma's; the title follows it with no gap,
  3 px lower than Figma's.
- **Each card is 6 px taller, so the second and third cards sit lower
  (Subagent card), `105:3200` y +5, `105:3223` y +9, `147:17` y +5,
  `147:19` y +9.** Figma pads a card 13; the section `Panel` pads 16. The
  gap between the cards is Figma's 10.
- **The chevrons end 8 px before Figma's (Subagent card), `147:15`,
  `147:17`, `147:19` x -8.** The 16 px chevron sits in a 24 px
  `Button size="xs"`, which ends at the inner edge of the Panel's 16 px
  padding; Figma's icon ends 13 in from the card's edge. A negative margin
  would push the button past the Panel body's edge, which scrolls
  (`hiddenOverflow`).
- **The transcript lines are dimmer and 2 px further apart (Subagent
  card).** Figma draws them in Geist Mono 11 in the text colour 18 apart
  (105:3210); the well draws them in Geist Mono 11 (`monoSm`) in
  `fg.muted` 20 apart, as in D3.
- **The card buttons' labels are larger (Subagent card).** Transcript,
  Hide transcript and Stop are 24 high, as in Figma (105:3197, 105:3215,
  105:3217), but Figma draws their labels in Geist Medium 11 and
  `textSize="xs"` draws `labelXs` (Medium 12/16), so each button is wider:
  Hide transcript 102 against 95, Stop 65 against 60, Transcript about 75
  against 70. No label style is Medium 11. Hide transcript keeps the
  default border while the transcript is open, as Figma draws it.
- **No home indicator.** The app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **What the view does not do yet.** The chevrons have their names but
  open nothing until M12 (the full transcript); Stop does not stop a
  subagent. Transcript and Hide transcript show and hide the last lines,
  and the back row returns to the chat, whose Subagents opens the view
  again.
