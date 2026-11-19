// An open item's Files tab (Figma `file browser`, D6 432:2141): a bordered
// box with the item's folders and files as a tree (the library's FileTree,
// `tree` 432:2142) and the selected file in the viewer beside it
// (`ToolkitFileViewer`, `viewer` 432:2290). The folders the state names are
// open at first; a click on a file selects it through `onSelect`. On the
// desktop the tree and the viewer sit side by side and the box runs to the
// pane's foot, as Figma's runs past the frame; on a tablet or phone (T4) the
// tree and the viewer are two bordered boxes, the viewer under the tree, each
// as high as its content. On the phone (M5 435:6) the tab shows the item's
// folder in the toolkit over the tree and no viewer: a file opens on a page of
// its own (`ToolkitFilePage`, M6 and M8), and the tree marks only the file
// opened last (`ui.file`). The library's FileBrowser draws the box and the
// tree's column (`layout="split"` on the desktop, `stacked` elsewhere). Props
// only.
import { FileBrowser, FileTree } from '@eshelton328/component-library-1701'
import type { KeyboardEvent, MouseEvent } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitFileBrowser as Browser } from '../types.ts'
import { type FileMode, fileMode, type OpenFile, opensPage } from './filesView.ts'
import { ToolkitFileViewer } from './ToolkitFileViewer.tsx'

// M5 435:212, 435:213: on the phone the folder 12 under the tabs and the tree 12 under it.
const stacked = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// M5 435:212: the item's folder in the toolkit, in mono, muted, over the tree.
const folderLine = css({ alignSelf: 'flex-start', textStyle: 'mono', color: 'fg.muted' })

export type ToolkitFileBrowserProps = {
  browser: Browser
  /** The selected file and what the viewer shows of it (`openFile` in blocks/filesView.ts). */
  open: OpenFile
  layout?: Viewport | undefined
  /** Called with a file's path when it is selected in the tree. */
  onSelect?: ((path: string) => void) | undefined
  /** Called with the selected file's path when the viewer's copy button is pressed. */
  onCopy?: ((path: string) => void) | undefined
  /** Explain or Code for a script with an explanation (D10, `ui.fileView`); Explain when not set. */
  mode?: FileMode | undefined
  /** Called with Explain or Code when the viewer's switch or a step's line link changes the view. */
  onModeChange?: ((mode: FileMode) => void) | undefined
  /** On the phone, the item's folder in the toolkit, over the tree (M5 435:212, "toolkit/skills/writer/"). */
  folder?: string | undefined
  /** On the phone, the file the tree marks: the one opened last (`ui.file`, M5's check), or none (M35). */
  marked?: string | null | undefined
  /** The line a link names in the selected file (`ui.line`, D19): the viewer opens its source at it. */
  line?: number | undefined
}

export function ToolkitFileBrowser({
  browser,
  open,
  layout = 'desktop',
  onSelect,
  onCopy,
  mode,
  onModeChange,
  folder,
  marked = null,
  line,
}: ToolkitFileBrowserProps) {
  const desktop = layout === 'desktop'
  const phone = layout === 'phone'
  const viewer = (
    <ToolkitFileViewer
      path={open.path}
      type={open.type}
      view={open.view}
      mode={fileMode(open.view, mode)}
      onModeChange={onModeChange}
      boxed={!desktop}
      line={line}
      onCopy={() => {
        onCopy?.(open.path)
      }}
    />
  )
  const files = (
    <FileTree
      nodes={browser.tree}
      selected={phone ? marked : open.path}
      defaultExpanded={browser.expanded}
      onSelect={onSelect}
    />
  )
  // On a tablet or phone a script with an explanation leaves the tree for its own page (T6), and Back to Files comes
  // back with it still selected; on the phone every file with a view does (M5). The library's FileTree reports no tap
  // on the row that is already selected, so a tap or Enter on that row here selects it again, and the file opens its
  // page again.
  const reopen = (event: MouseEvent | KeyboardEvent) => {
    if (!opensPage(open.view, true, phone) || !(event.target instanceof Element)) return
    const row = event.target.closest('[role="treeitem"]')
    if (row?.getAttribute('aria-selected') === 'true') onSelect?.(open.path)
  }
  // On a tablet or phone the tree takes the reopen tap (T4, M5); on the desktop a file opens beside it.
  const tapTree = (
    <div
      onClickCapture={reopen}
      onKeyDownCapture={(event) => {
        if (event.key === 'Enter') reopen(event)
      }}
    >
      {files}
    </div>
  )
  // M5 435:212, 435:213: the folder over the tree in its box, with no viewer.
  if (phone)
    return (
      <div className={stacked}>
        {folder === undefined ? null : (
          <span className={folderLine} data-figma={folder}>
            {folder}
          </span>
        )}
        <FileBrowser layout="stacked" tree={tapTree} figma={{ tree: 'tree' }} />
      </div>
    )
  // T4 434:408, 434:485: the tree's box and the viewer's 12 under it (Figma 14; no space token has 14, d-050).
  if (!desktop)
    return (
      <FileBrowser layout="stacked" tree={tapTree} figma={{ tree: 'tree' }}>
        {viewer}
      </FileBrowser>
    )
  // D6 432:2141, 432:2142: one box, the tree's column `shell.sidebar` (328; Figma 330) on the well beside the viewer.
  return (
    <FileBrowser tree={files} figma={{ root: 'file browser', tree: 'tree' }}>
      {viewer}
    </FileBrowser>
  )
}
