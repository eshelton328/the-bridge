# states/shared

Data that several Toolkit states use: an item's evals, activity,
discussion, link targets or the Activity view's counts. Nothing here is a
state: `pnpm gen:registry` and `pnpm check:states` read only the files
directly in `../`, so a file here gets no story, board or screen.

- Open each file with a comment that says which states use it and which
  frames its text comes from (`references/toolkit/<frame>/frame.json`).
  Copy that text word for word.
- Each Overview state carries its item's shared `results` and
  `activity`, so a tab opens whichever state opened the item.
- A file here may import a state from `../` for its data; a state that
  file imports must not import that file back (`pnpm check:cycles`).
