# T21 deviations

What still differs from Figma T21 · The new tasks in the inbox (`tasksCreatedList`, D18's list on the tablet), after the last
fidelity run (`pnpm fidelity inbox`, all 70 frames, 2026-11-17,
against the installed library 1.0.0-beta.7, which has #107 and #108), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (67 strings checked; 0 Figma strings under exceptions.json).
- Position: 7 of 14 layers pass (`header`, `filter · chips`, `list tools`, `group · NEEDS YOU`, `group · NEXT STEPS`, `group · SNOOZED`, `tab bar`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 29 px
shorter, below Figma's status bar (d-102), and the position check adds
29 to each render y (d-101).

- `toast · created`: x -144, y -4, w +288, h +0.

## Deviations

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
- **List rows and group headers.** As in T01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108). The later groups start within the tolerance
  (`group · NEXT STEPS`, `group · SNOOZED`).
- **Search field and chip counts.** The search field's text and
  placeholder are 13 px (`SearchField textSize="sm"`, `bodySm`, #106),
  as Figma's (402:11999). Idle chip counts are `fg.subtle` (#7986a6, #106);
  Figma's #4a5675 stays out by d-099, because it fails WCAG AA (d-055).
- **New rows.** The new tasks are `ListRow` rows with a `StatusPill`
  "New"; Figma draws them as bordered rows on a raised fill. Library
  gap: New list row.
- **Toast.** `Toast` takes the list's width (708 px); Figma's is 420
  px and centred (`toast · created` x -144, w +288). It sticks to the
  bottom of the list. In the position check's page, 29 px shorter
  (d-101), it sits 20 above the tab bar against Figma's 16
  (`toast · created` y -4).
  Library gap: Toast width on the tablet. Undo takes the new tasks out,
  as on the phone (M22): the state names the rows it draws as created,
  and Undo clears its applied Create (`InboxRoute.test.tsx`).
- **Tab bar.** The tabs are one centred group, 456 px wide from x 150
  (library #125, `TabBar size="tablet"`), and the bar (`tab bar`) is in
  place. Figma draws five tabs of 91.2 px with no Artifacts tab; the app
  draws six of 76, so `tab · Home`, `tab · Inbox`, `tab · Workspaces`,
  `tab · Projects` and `tab · More` are off in x and w (Home w -15.2,
  More x +15.2) and `tab · Artifacts` has no layer. The design predates
  d-105, which adds the Toolkit (and Artifacts) item; the app draws the
  six-item navigation.
- **List fits.** The checks render 1129 px high, the screen below the
  status bar (d-102). With 56 px rows and 36 px group headers (library
  #108) the list fits the screen above the tab bar, as Figma's does, so
  the rules check passes. With 58 px rows and 38 px headers it was 12
  px taller than that screen and scrolled (`hiddenOverflow` on
  `main.app-shell__detail`).
- **Button labels.** Newest and Filter take `Button textSize="sm"`
  (Medium 13, #105), as Figma draws them. The approval row's Allow
  once, Deny and Open chat take `textSize="xs"` (`labelXs`, Medium
  12/16), Figma's Medium 12 (d-100). The labels match Figma's; the
  toast's Undo is `Toast`'s own action.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `group · NEXT STEPS` within tolerance (was
  x +2, y +18, w -4, h +4); `group · SNOOZED` within tolerance (was x
  +2, y +40, w -4, h +4); `toast · created` x -144, y -4, w +288, h +0
  (was x -144, y +8, w +288, h +0). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).

## Second review, round 2

A second blind review compared `frame.png` with the render (2026-11-17). Each finding, fixed or with why it stays:

- Search placeholder larger and lighter, chip counts lighter (P3): fixed in part by beta.5: the placeholder is 13 px and idle counts are `fg.subtle`; Figma's #4a5675 stays out by d-099 (fails WCAG AA, d-055).
