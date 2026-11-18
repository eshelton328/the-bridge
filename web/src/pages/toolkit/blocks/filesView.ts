// The file the Files tab shows (D6): the path in `ui.file` when the tree has
// it, else the browser's `selected`; its tree node (for its name and icon) and
// what the viewer knows of it. Pure, so filesView.test.ts checks it without
// rendering.
import type { ToolkitFileBrowser, ToolkitFileNode, ToolkitFileView } from '../types.ts'

/** The node with this path, at any depth of the tree; undefined when no node has it. */
export function findFile(nodes: readonly ToolkitFileNode[], path: string): ToolkitFileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node
    const inside = findFile(node.children ?? [], path)
    if (inside !== undefined) return inside
  }
  return undefined
}

export type OpenFile = {
  /** The selected node's path. */
  path: string
  /** A script (`code`) or another file; a folder shows as a file with no view. */
  type: 'file' | 'code'
  /** What the viewer shows of it; undefined when the state has no view of the file (its bar only). */
  view: ToolkitFileView | undefined
}

/** The selected file of a browser: `file` (`ui.file`) when the tree has it, else the browser's `selected`. */
export function openFile(browser: ToolkitFileBrowser, file?: string): OpenFile {
  const path = file !== undefined && findFile(browser.tree, file) !== undefined ? file : browser.selected
  const node = findFile(browser.tree, path)
  return {
    path,
    type: node?.type === 'code' ? 'code' : 'file',
    view: browser.views.find((v) => v.path === path),
  }
}
