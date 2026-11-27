# references

What Figma shows for each frame: the input of the fidelity checks
([../scripts/fidelity/AGENTS.md](../scripts/fidelity/AGENTS.md)). One
folder per page, and in it one folder per frame, named with a letter and
two digits (`D01`, `T03`, `M12`). The Figma file is
`PZoW9BBu43qRgon1KhJcwU`; it is read-only.

A frame folder holds `frame.png` (Figma `get_screenshot` at 1:1),
`frame.json` (written by `pnpm fidelity:refs`), `note.txt` (the frame's
`note·` annotation) and, optionally, `exceptions.json` (by hand).

## Rules

- Never edit `frame.png`, `frame.json` or `note.txt` by hand to make a
  check pass. When the design changes, save them from Figma again:
  `get_screenshot` for the PNG (`contentsOnly`, `maxDimension` = the
  frame's longer side), and `get_metadata` of the page saved to a file,
  then `pnpm fidelity:refs --page <page> --metadata <file>`.
- `get_metadata` gives a text layer's name, not its characters. When a
  page renames text layers (`title`, `age`), read the characters of each
  text layer whose name differs with one read-only `use_figma` call, save
  them as `{"<node id>": "<characters>"}` and add
  `--characters <file.json>`. The Artifacts page needs it.
- `note.txt` is documentation for the builder; its text never goes into
  the UI.
- This folder is an exception to the secret scan's personal-term rule
  only, as it keeps the names Figma draws (`.gitleaks.toml`).

## PNG references

A page with no Figma frame (Settings, d-119) has PNG references: a frame
folder with `frame.png`, `reference.json` and `note.txt`, and no
`frame.json`. `reference.json` is written by hand: the frame's size in
CSS px, its device, its mode (`light` or `dark`), its `source` and the
original picture's file, size and sha256. `frame.png` is the original
scaled to that size. A folder holds `frame.json` or `reference.json`,
never both. On a PNG reference the fidelity tools run the rule check and
need a `fidelity-reviewer` record with no P1 or P2 finding, and give the
reviewer a pixel diff. A passing review is saved as the frame's
`review.json` with a hash of its inputs, and `pnpm check:reviews` fails
when it is missing, stale or edited
([../scripts/fidelity/README.md](../scripts/fidelity/README.md)).

- `settings/` holds the lab screenshots the owner approved; each note names
  its source, `lab a52ab2d4 + d-119`. Never replace one to make a check
  pass; a new design reference (a Claude Design artboard) replaces them
  with a new source.
- `projects/` holds the Projects app's frames (f-008, increment one,
  d-133): 01 Overview, 08 Ideas, 09 the idea page and 10 the Projects
  home, on D, T (iPad portrait) and M, with `b` for iPad landscape
  (`T01b`). Frames 01, 08 and 09 are 1:1 Playwright renders of the saved
  design HTML; frame 10 is Figma `get_screenshot` of the read-only file
  `yJaVpShE9RVoQwUeUBnMQ4`. Each note names its source and the tabs and
  buttons of later increments that the build leaves out.
