// The file the Files tab shows (D6): the path in `ui.file` when the tree has
// it, else the browser's `selected`; its tree node (for its name and icon) and
// what the viewer knows of it. Pure, so filesView.test.ts checks it without
// rendering.
import type { ToolkitFileBrowser, ToolkitFileNode, ToolkitFileView, ToolkitMarkdownBlock, ToolkitUi } from '../types.ts'

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

/**
 * How the viewer shows a file: a script's explanation (D10) or a Markdown file rendered (T4), or the file's source
 * (`code`).
 */
export type FileMode = 'explain' | 'rendered' | 'code'

/** Whether a view is a Markdown file drawn from its blocks, with no code of its own (T4 doc.md). */
const isMarkdown = (view: ToolkitFileView | undefined): boolean =>
  view !== undefined && view.code === undefined && view.blocks.length > 0 && view.summary !== true

/**
 * The view of the selected file: Explain, the default of a script with an explanation and code, unless `mode`
 * (`ui.fileView`) asks for Code; Rendered, the default of a Markdown file, unless `mode` asks for its source (Code);
 * Rendered with no switch for a file summed up by its blocks (`summary`, T35); Code for any other file, which has no
 * switch.
 */
export function fileMode(view: ToolkitFileView | undefined, mode?: FileMode): FileMode {
  // T35: a script summed up by its blocks shows them, with no switch.
  if (view?.summary === true) return 'rendered'
  if (isMarkdown(view)) return mode === 'code' ? 'code' : 'rendered'
  if (view?.explain === undefined || view.code === undefined) return 'code'
  return mode === 'code' ? 'code' : 'explain'
}

/** The switch of a file with two views: Explain and Code for a script with an explanation (D10), Rendered and Source
 * for a Markdown file (T4); none for another file. */
export function fileModes(view: ToolkitFileView | undefined): readonly { value: FileMode; label: string }[] {
  if (isMarkdown(view))
    return [
      { value: 'rendered', label: 'Rendered' },
      { value: 'code', label: 'Source' },
    ]
  if (view?.explain === undefined || view.code === undefined) return []
  return [
    { value: 'explain', label: 'Explain' },
    { value: 'code', label: 'Code' },
  ]
}

/** A Markdown file's source, written back from its blocks, one blank line between blocks (T4 Source). */
export function markdownSource(blocks: readonly ToolkitMarkdownBlock[]): string[] {
  return blocks.flatMap((block, i) => {
    const gap = i === 0 ? [] : ['']
    switch (block.type) {
      case 'title':
        return [...gap, `# ${block.text}`]
      case 'heading':
        return [...gap, `## ${block.text}`]
      case 'paragraph':
        return [...gap, block.text]
      case 'code':
        return [...gap, block.items.map((item) => `\`${item}\``).join('  ')]
      case 'pre':
        return [...gap, '```', ...block.text.split('\n'), '```']
    }
  })
}

/** Whether a file opens on a page of its own on a tablet or phone (T6): a script with an explanation. */
export function opensOwnPage(view: ToolkitFileView | undefined): boolean {
  return fileModes(view).some((m) => m.value === 'explain')
}

/** Whether a file opens on a page of its own on this layout: on the phone any file the state has a view of (M5 to
 * M6), since the phone shows the tree with no viewer under it; on a tablet a script with an explanation (T6). */
export function opensPage(view: ToolkitFileView | undefined, narrow: boolean, phone = false): boolean {
  return phone ? view !== undefined : narrow && opensOwnPage(view)
}

/**
 * The ui change that selects a file in the tree: the file on its default view. On a tablet or phone a script with an
 * explanation opens on a page of its own (T6), since Explain needs the item's width; another file opens under the
 * tree (T4). On the phone (`phone`) every file with a view opens on its page (M5 to M6 and M8).
 */
export function selectFile(
  browser: ToolkitFileBrowser,
  path: string,
  narrow: boolean,
  phone = false,
): Partial<ToolkitUi> {
  const page = opensPage(openFile(browser, path).view, narrow, phone)
  return { file: path, fileView: undefined, filePage: page ? true : undefined }
}
