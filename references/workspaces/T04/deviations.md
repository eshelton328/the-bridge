# T04 deviations

What still differs from Figma T4 · Composing (bridge themes on the iPad
mini while Erik types, with the keyboard up, `tabletComposing`), after
the last fidelity run (`pnpm fidelity workspaces T04`, 2026-11-18,
library 1.0.0-beta.39), each with its reason. The library gaps are in
`web/src/pages/workspaces/LIBRARY_GAPS.md`. The screen is T2's
`PhoneChat` at the tablet's width (`device="tablet"`, with `tabletList`):
`ChatHead size="full"` over `ChatPane size="tablet"`, with "/" typed
after requirements.md was attached, so the skill list is open over the
composer (`SkillPicker layout="phone"`, as in M03) with /writer
highlighted, and Stop shows while the chat works. The chat has no tab
bar, so the render has no Artifacts tab, and no exception is needed.

## Checks

- Text: pass. Every Figma string is in the render and visible; the
  render has no extra text.
- Position: fail, 4 of 8 layers pass: the header (`105:2157`), the back
  button (`105:2159`), the ⋯ (`105:2170`) and Erik's message
  (`105:2222`). Four fail:
  - `105:2227` (Claude's reply with Copy): h +8.
  - `105:2239` (Claude's second reply): y +4, h +5.
  - `105:2261` (the composer): y +309, h +7.
  - `105:2246` (the skill list): y +318.
- Rules: pass.

## Deviations

- **No keyboard; the composer and the skill list sit at the screen's
  end (Phone keyboard, Tablet safe area), `105:2261` y +309, `105:2246`
  y +318.** Figma draws the iPad keyboard over the lower 300 points
  (105:2293, from y 858; its text is excluded, d-089) and sizes the page
  to the area above it: the composer ends 16 over the keyboard and the
  skill list sits 14 over the composer. `AppShell` is as tall as its
  parent and has no prop for the visible area, and the app may not set a
  measured height, so the render keeps the full height: the composer
  ends at the screen's end (`AppShell size="tablet"` keeps no safe area
  under a detail with no tab bar), the skill list is over it, and the
  band where Figma has the keyboard shows the backdrop and the empty
  transcript. The header keeps its two rows, as Figma's T4 does.
- **Claude's replies are taller (Message text), `105:2227` h +8,
  `105:2239` y +4, h +5.** `Message` draws the text in `body` (14/20)
  and the name in `label` against Figma's Geist 13 on a 19 px line and
  SemiBold 12, and Copy is 24 high against 22; the first reply wraps at
  another word, so the second reply starts 4 lower.
- **The composer is 7 px taller (Composer text, Composer attachment
  remove), `105:2261` h +7.** `Composer` draws its text in `body` and
  Stop as `Button size="sm"`, so Stop is wider than Figma's 61; the
  attachment chip is 26 high against Figma's 22, with a thin paperclip
  and × against Figma's heavy ones.
- **The skill list (Skill picker).** The list is `Popover width="lg"`,
  360 wide as Figma's, and /writer is white on its filled row where
  Figma draws it in the accent colour, as in M03.
- **No caret.** Figma draws the caret after "/" (105:2271). The message
  box has the focus (its border is cyan), but the screenshots hide the
  caret.
- **The ⋯ is lighter and the header is 2 px taller (Chat header, Chat
  header text).** As on T02b: a thin 20 px `MoreIcon` against Figma's
  heavy 18 px icon, and the title in `subtitle` (17/24); within the
  tolerance.
- **The transcript sits 24 in from the sides, Figma's 22,** on the 4 px
  grid; within the tolerance.
- **The stars sit elsewhere (Backdrop stars).** `Backdrop size="tablet"`
  draws the library's fixed star field, not T4's own stars.
- **No status bar.** The app draws no status bar (d-089), so the
  side-by-side shows a blank band at the top.
- **Square screen corners (device chrome).** Figma draws the iPad's
  screen with rounded corners (the device frame); the app draws square
  corners, as it draws no device chrome (d-089, review T01 F3).
- **The SKILLS label is wider (Skill picker).** Figma draws it in Geist
  Mono Regular 10 (105:2248, Figma read 2026-11-18); `PopoverSection`
  draws `eyebrow` (Mono 11) and takes no label size, so it is 42 wide
  against 36 (review T04 F1).
- **Thin icons (Icon stroke weight).** Figma draws the back chevron, the
  model chips' chevrons and the composer's paperclips with a 2 px stroke
  at their own size, so they look heavy; the icon set draws a 2 px
  stroke in a 24 px box and takes no stroke weight, so at 12 to 20 px
  they look thinner and lighter (review T06 F2, F3).
- **The model chip's chevron is grey (Model chip chevron).** Figma draws
  it in the text colour, as the chip's label; `ModelChip` draws its own
  chevron in a muted grey and takes no tone (review T06 F2).
- **Erik's message is larger (Message text).** Figma draws it in Geist
  13 on a 19 px line; `Message from="user"` draws `body` (14/20), so it
  is about 7% wider (review T06 F1).
- **Actions still to build.** The app does not measure the keyboard:
  the open skill list comes from the state. Attach, the attachment's ×,
  Stop, Send and a pick in the skill list draw only, as in M03.
- **No exceptions.**
