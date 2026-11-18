# T03 deviations

What still differs from Figma T3 · Subagents (bridge themes' subagents on
the iPad mini, `tabletSubagents`), after the last fidelity run (`pnpm
fidelity workspaces T03`, 2026-11-18, library 1.0.0-beta.39), each with
its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is M6's
`PhoneSubagents` with `device="tablet"` in the tablet's detail with no tab
bar: `BackRow` to the chat, `PageHeader size="phone"` and the count line
in a `ScrollFrame` header, over D3's `SubagentCard`s with `size="phone"`
and no chevrons, then Start a subtask.

## Checks

- Text: pass. Every Figma string shows, and the render shows no other.
- Position: fail, 6 of 8 layers pass: the header (`105:2020`), the title
  (`105:2025`), the count line (`105:2029`) and the three cards
  (`105:2031`, `105:2044`, `105:2067`). Two fail:
  - `105:2021` (the back row): w +20.8, h +10.
  - `105:2087` (Start a subtask): y +5.
- Rules: pass.

## Deviations

- **The back row is larger (Phone back row), `105:2021` w +20.8, h +10.**
  Figma's back row is 117 × 18, 12 under the status bar, with an 18 px
  chevron and the chat's name in Regular 15. `BackRow` is 28 high with a
  20 px chevron and the name in 16 px Medium, so "bridge themes" is larger
  and the row is 138 × 28; it starts 8 under the bar, so its middle is
  1 px under Figma's, and the title follows it with no gap.
- **Each card is 6 px taller, so Start a subtask sits lower (Subagent
  card), `105:2087` y +5.** Figma pads a card 13; the section `Panel` pads
  16. The cards keep Figma's 12 between them and Start a subtask keeps
  Figma's 12 under the last card, so the three cards' extra height moves
  the button down. The cards stay within the tolerance.
- **Start a subtask is 2 px lower and its sparkle larger (Tablet subtask
  button).** Figma's button is 30 high with a 14 px sparkle 6 before the
  label; `Button size="sm"` is 28 high with a 16 px sparkle 4 before it,
  as wide as Figma's (131 against 129).
- **The sides are 2 px further in.** Figma's parts are 22 in from the
  screen's sides; the view pads 24, the tablet `Container`'s inset on the
  4 px grid, so the cards are 708 wide against 712.
- **The transcript lines are dimmer and 2 px further apart (Subagent
  card).** Figma draws them in Geist Mono 11 in the text colour 18 apart
  (105:2055); the well draws them in `monoSm` in `fg.muted` 20 apart, as in
  M6.
- **The card buttons' labels are larger (Subagent card).** Transcript,
  Hide transcript and Stop are 24 high, as in Figma, but Figma draws their
  labels in Geist Medium 11 and `textSize="xs"` draws `labelXs` (Medium
  12/16), so each button is a few px wider (Hide transcript about 102
  against 95). Hide transcript keeps the default border while the
  transcript is open, as Figma draws it.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's stars at fixed places, not Figma's 58.
- **No status bar or home indicator.** The app draws neither (d-089), so
  the side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **Thin icons (Icon stroke weight).** Figma draws the back row's
  chevron and the sparkles (105:2033, 15 px, and Start a subtask's
  105:2088, 14 px, #9B8CFF; stroked, not filled, so `SparkFilledIcon`
  does not fit) with a 2 px stroke at their own size, so they look
  heavy; the icon set draws a 2 px stroke in a 24 px box and takes no
  stroke weight, so at 12 to 20 px they look thinner and lighter (review
  T03 F1).
- **What the view does not do yet.** Stop does not stop a subagent.
  Transcript and Hide transcript show and hide the last lines, the back
  row returns to the chat, and Start a subtask opens D17's Subtask form
  in a sheet over the chat (M20's sheet), which starts nothing.
