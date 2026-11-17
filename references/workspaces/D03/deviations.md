# D03 deviations

What still differs from Figma after the first build of the subagents
panel and the New chat form (`pnpm fidelity workspaces`, 2026-11-17,
against the library's 1.0.0-beta.15; the same on 1.0.0-beta.16), each with its reason. The library gaps are in `web/src/pages/workspaces/LIBRARY_GAPS.md`.
The screen is D02b's sidebar layout with hono server (the-bridge) in the
middle, the subagents panel in the side slot (`sideWidth="wide"`, 420) and
the New chat form (`Dialog size="lg"`, 540) open over it.

## Checks

- Text: fails on `78%` (105:1235). `ContextMeter` draws each percentage
  as one text node, so `42%`, `23%` and `18%` pass. Figma has `78%` twice,
  in the hono server row (105:1164) and the chat header (105:1235). The
  header shows it in full, but the hono server row's `78%` is cut by 2 px
  (`hiddenOverflow` below; LIBRARY_GAPS.md row "Sidebar chat row"), and
  the check wants one visible run per layer, so it reports one `78%` as
  not visible. The fix is in the library; there is no exception for it.
  `Artifacts` and `Toolkit` (rail, d-105) are excepted as on D01 and D02b.
- Position: 23 of 43 layers pass. `105:1277`, `105:1283`, `105:1335`,
  `105:1358`, `105:1379`, `114:2`, `105:1404`, `105:1389`, `105:1393`,
  `105:1399`, `105:1414`, `105:1409`, `128:2`, `128:8`, `128:12`,
  `128:19`, `105:1422`, `105:1417`, `105:1438` and `105:1427` fail.
- Rules: `hiddenOverflow` on the hono server row's meta line (105:1154).
  The `scrollBar` finding on the name field's input is excepted: Chrome's
  `clientWidth` of an `<input>` leaves out its 10 px side padding, so the
  rule reads the padding as a 20 px scroll bar; the field draws none.

## Deviations

- **New chat form is lower and shorter (Composer in a form).** `105:1379`
  y +17, h -19: the first message box (`105:1427` y +25, h -23,
  `105:1438` h -20) is `Composer`, which sizes its text area to one line
  (78 px against Figma's 101); no size token is near 101. The dialog is
  centred, so it starts 17 px lower and every field moves down with it:
  `114:2`, `105:1404`, `105:1389`, `105:1393`, `105:1399`, `105:1414`,
  `105:1409`, `128:2`, `105:1422` and `105:1417` are y +17 to +23, and
  their places inside the form are within 4 px of Figma's. The composer
  also draws a send button, which Figma's box has not.
- **"random if blank" (Field hint).** Figma draws the hint inside the name
  field at its end; `TextField` has no slot there, so the hint is at the
  end of the label row, 20 px higher.
- **Field labels (Form field label).** The labels are `eyebrow` (Mono 11,
  capitals) as in Figma, 6 px above the control against Figma's 8.
- **Runs in, Workspace and Model (Runs in choice, Select field).** The
  boxes are 36 px (`Button size="lg"`) against Figma's 39 and 37, and the
  values are Medium 14 (`label`) against Regular 14.
- **Folder chips (Folder chip).** `128:8` w -7, `128:12` x -9, `128:19`
  x -8: the paths are in `label` (Geist 14) against Figma's Geist Mono 13,
  the chips are 28 px against 30, and the × of ~/omni is part of the
  chip's button.
- **Dialog padding.** The form is padded 20 (`Dialog`) against Figma's 22,
  so the fields are 4 px wider and Cancel and Start chat sit 4 to 6 px
  further left (within the tolerance).
- **Subagent cards (Subagent card).** `105:1335` h +6 and `105:1358` y +9,
  h +19: the card is a section `Panel`, padded 16 against Figma's 13, so
  the transcript well is 2 px taller per line gap and "Started from this
  chat with its full context; returns its result here." wraps to two
  lines in the 353 px inside the card (Figma 360). The sparkle is 16 px
  (Figma 15).
- **Main chat.** `105:1277` h +6: the reply wraps in body text (14/20),
  as on D02. `105:1283` h +6: `ProposalBlock` is taller than Figma's
  approval box, as on D01. The reply has no Copy button, as in Figma.
- **Context meter in sidebar rows (Sidebar chat row).** `hiddenOverflow`
  on 105:1154: the hono server row's meta ("Sonnet 5.5" and "78%") is
  152 px in a 150 px column beside its `Needs you` pill, so the end of
  "78%" is cut 2 px, as on D02 and D02b.
- **Chat header and group headers (Chat header, Sidebar group header).**
  As on D02b: the ⋯ is a `Button size="xs"` (24 px) against 30 × 22, and
  the group header buttons are 24 px with 12 px icons. Figma's group
  headers in D3 have no drag handle, and the build leaves it out
  (`sidebar.grip: false`).
- **Sticky bars (d-107).** The subagents panel's title row and the
  main chat's header and composer stay in view; only the cards and the
  transcript scroll. The frame shows the top of the scroll, so this
  changes no pixel here.
- **Rail.** The shared `AppRail` adds Artifacts and Toolkit before More
  (d-105), so More sits lower than Figma's.
- **Focus of the first message.** Figma draws the first message with the
  cyan border of a focused field; the dialog moves the focus there when it
  opens (`initialFocus`), but the screenshot may show it without focus.
