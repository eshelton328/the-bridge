# Workspaces blocks

Props-only blocks only this page uses, one component per file, named
PascalCase after the component, and the page's pure helpers in camelCase
`.ts` files. Make one with `pnpm new block <Name> --page workspaces`.

- A block a second page needs moves to `src/blocks/` (d-089).
- Extend a block with a prop (`size`, `device`, `layout`,
  `placement`) for a new device or frame; do not copy it.
- Put each Figma layer id on `data-figma`, from the state's
  `data.layers`, so the fidelity check can find the part. A block that
  gained `layers` for a later frame falls back to its first frame's ids.
- A "/" typed at the start of a message, or before the caret, opens the
  skill list, and the focus stays in the box. A pick puts the skill and a
  space in place of that word (`lib/skillQuery.ts`); the caret stays in
  the box, so the phone's keyboard stays up (`SkillPick.test.tsx`).
- The skill list is 40% of the composer, from 240 to 400 wide (review R8,
  `SkillListWidth.test.tsx`), and as high as Figma draws it
  (`SkillListHeight.test.tsx`).
- A composer stops a long draft at 30% of its pane, as each `PaneFrame`
  is a size container, and scrolls inside (d-107).
