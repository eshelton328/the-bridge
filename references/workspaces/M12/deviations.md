# M12 deviations

What still differs from Figma M12 · Subagent transcript (Layout notes'
full transcript on the phone, `phoneSubagentTranscript`), after the last
fidelity run (`pnpm fidelity workspaces`, 2026-11-18, library
1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is
`PhoneSubagentTranscript` in the phone's detail with no tab bar: the
trail (`TranscriptTrail`) and the header in a `ScrollFrame` header, the
task and the entries in its body, and the read-only note as its footer.

## Checks

- Text: pass. Every Figma string shows.
- Position: fail, 8 of 15 layers pass: the trail (`147:339`), its
  chevron (`147:340`), Subagents (`147:344`), the header (`147:345`), the
  status (`147:351`), the meta line (`147:354`), Stop (`147:356`) and the
  note (`147:387`). Seven fail:
  - `147:342` (the chat in the trail): w +4.1.
  - `147:349` (the title, Layout notes): w -12.7.
  - `147:368` (the task box): h +15.
  - `147:371` (Read captures/the-bridge-requirements.md): y +14.
  - `147:374` (Read f-005-the-bridge/pages.md): y +14.
  - `147:377` (writer's message): y +14, h +7.
  - `147:383` (Writing layout-notes.md): y +21.
- Rules: pass.

## Deviations

- **The trail's names are a little wider, so "›" sits close to them
  (Phone trail), `147:342` w +4.1.** Figma draws the chat and Subagents
  in Geist Regular 14 with 4 between the parts. The library has no
  trail, so each name is a text `Button` in `body` (Regular 14) with no
  padding, 2 apart plus the button's 1 px transparent border. "bridge
  themes" renders 92 wide against Figma's 88, so "›" and Subagents sit 2
  to 4 px further right and the gaps look narrower.
- **The title is smaller (Subagent transcript header), `147:349` w
  -12.7.** Figma's Layout notes is SemiBold 24 on a 29 px line. No title
  style is 24: `PageHeader size="page"` draws `title` (20/28), so the
  title is 124 wide against 137. The sparkle is 20 px against Figma's 18
  (no 18 px icon size).
- **The task box is taller, so the transcript under it starts 14 px lower
  (Subagent task box), `147:368` h +15, `147:371` y +14, `147:374` y +14,
  `147:377` y +14.** Figma pads the box 10 inside its border and puts the
  label 6 over the task. `ProposalBlock tone="update"` draws the same
  violet border and label, but pads 12 and puts 12 between the label (16
  high) and the task, so the box is 94 high against 79. Its fill is
  `surface.inset` where Figma's is faintly violet (rgba(155,140,255,0.08)).
  The task text is `bodySm` (13/20) for Figma's Geist Regular 13 on a 19
  px line (d-100), so it breaks where Figma's does ("…one section" /
  "each, from…").
- **The task's label is larger (Subagent task box).** Figma draws TASK
  FROM BRIDGE THEMES (147:369) in Geist Mono Regular 10, 138 wide.
  `ProposalBlock` draws its label in `eyebrow` (Geist Mono 11/16 with
  0.44 px letter spacing), about 161 wide; no text style is mono 10, and
  `ProposalBlock` takes no label style.
- **writer's message is 7 px taller (Message text), `147:377` h +7,
  `147:383` y +21.** Figma's name row is 16 high and the text runs on a
  19 px line; `Message` draws the name in `label` (20 high) and the text
  in `body` (14/20), on the 4 px grid (d-100). The Writing line under it
  is 21 px lower: 14 from the task box and 7 from the message. The text
  also wraps one word earlier ("Writing each section now." starts the
  third line).
- **Stop is 2 px lower (Button size).** Figma's Stop (147:356) is 67 ×
  30; `Button size="sm"` is 28 high (`control.sm`). The page pads it 10
  inside its border with its parts 6 apart (147:357, 147:359), as Figma
  does, where `size="sm"` pads 8 and puts them 4 apart; the width is
  within the tolerance.
- **The running dot is cyan (Running tool line).** Figma draws the dot of
  Writing layout-notes.md in violet, the colour of the Running pill;
  `ToolLine state="running"` draws `status.working.fg`.
- **The read-only note is a little darker (Raised notice).** Figma fills
  the note (147:387) with #17213a, `surface.raised`; the notice `Panel`
  fills with `surface.pane`, and none of its tones is raised. The text
  (147:388) is Geist Regular 12 on a 17 px line in Figma, which `small`
  (12/16, d-100) in `fg.muted` matches.
- **No home indicator.** The app draws no status bar or home indicator
  (d-089), so the side-by-side shows a blank band at the top.
- **What the view does not do yet.** The trail's chevron and Subagents
  return to the subagents and the chat returns to bridge themes, and the
  chevron of a card in the subagents opens the transcript again. The
  browser's back gesture does not follow that path yet: the phone view is
  ui state, not a route. Stop does not stop the subagent.
- **Live tool calls (review R32, a frame exception the app owns).** Erik
  wrote: "these tool messages aren't great like send message bash macro
  etc. how can we improve that". Figma draws a tool call as a tool line:
  a status dot and the tool's name and target in mono, `fg.muted`
  (147:373, 147:376, 147:385). A live call from a server with backend #371 keeps that line's
  mono, colour and 6 px gaps, but draws its kind's icon in the dot's place
  and state colour, a readable title in place of the raw name and its own
  one-line label in `fg.subtle` in place of the target; a run of two or
  more calls draws as one `ToolLine` with a summary of its kinds and
  counts, which a tap opens (`blocks/ToolRow.tsx`, `blocks/ToolGroup.tsx`;
  LIBRARY_GAPS.md: Tool row icon and label, Tool group row). Figma draws no
  icon, title, label or group. This frame's fixture calls have no kind, so
  they draw as before and its render does not change.
