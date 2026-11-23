# Settings states

One file per PNG reference of the Settings page (`references/settings/`),
listed in `index.ts`. Make one with
`pnpm new state <id> --page settings --frame <D1>`, which adds its
`index.ts` entry and its story.

- A frame's node is `lab a52ab2d4`, the source its `note.txt` names; there
  is no Figma node.
- `settingsDesktop` (D1) holds the data the others share: the default
  settings and the switch off. A Light state only sets Mode to Light.
- T3 and T4 are an iPad in landscape (1180 px), narrower than the desktop
  layout's 1232, so they draw the tablet layout.
