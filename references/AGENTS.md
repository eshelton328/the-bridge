# references

What Figma shows for each frame: the input of the fidelity checks
([../scripts/fidelity/AGENTS.md](../scripts/fidelity/AGENTS.md)). One
folder per page, and in it one folder per frame, named with two digits
(`D01`, `T03`, `M12`). The Figma file is `PZoW9BBu43qRgon1KhJcwU`; it is
read-only.

| File              | Source                                   | What it holds                                                                                                                 |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `frame.png`       | Figma `get_screenshot`, at 1:1           | The frame as Figma draws it                                                                                                   |
| `frame.json`      | `pnpm fidelity:refs` from `get_metadata` | Name, node id, size, `tolerance`, every layer with its box from the frame's top-left and, for text, its characters; `exclude` |
| `note.txt`        | The frame's `note·` annotation           | What the frame shows and why. Documentation only; never UI text                                                               |
| `exceptions.json` | Written by hand, optional                | Accepted differences, each with a reason                                                                                      |

## Rules

- Never edit `frame.png`, `frame.json` or `note.txt` by hand to make a
  check pass. When the design changes, save them from Figma again:
  `get_screenshot` for the PNG (`contentsOnly`, `maxDimension` = the
  frame's longer side), and `get_metadata` of the page saved to a file,
  then
  `pnpm fidelity:refs --page <page> --metadata <file>`.
- The stars of the backdrop are left out of `layers` (`skipped` counts
  them).
