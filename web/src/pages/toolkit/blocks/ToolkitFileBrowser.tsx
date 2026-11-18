// An open item's Files tab (Figma `file browser`, D6 432:2141): a bordered
// box with the item's folders and files as a tree (the library's FileTree,
// `tree` 432:2142) and the selected file in the viewer beside it
// (`ToolkitFileViewer`, `viewer` 432:2290). The folders the state names are
// open at first; a click on a file selects it through `onSelect`. On the
// desktop the tree and the viewer sit side by side and the box runs to the
// pane's foot, as Figma's runs past the frame; on a tablet or phone (T4) the
// tree and the viewer are two bordered boxes, the viewer under the tree, each
// as high as its content. Props only.
import { FileTree } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitFileBrowser as Browser } from '../types.ts'
import { type FileMode, fileMode, type OpenFile } from './filesView.ts'
import { ToolkitFileViewer } from './ToolkitFileViewer.tsx'

// D6 432:2141: a bordered box, as the Overview's file preview (D3 427:273). The library has no file browser frame
// (LIBRARY_GAPS.md, File browser), so the box is drawn here with the Panel's tokens.
const box = css({
  display: 'flex',
  minW: '[0]',
  bg: 'surface.pane',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'xl',
  overflow: 'hidden',
})
// D6 432:2142: the tree column is 330 wide (`shell.sidebar` is 328, the file tree's width) and the viewer takes the
// rest; the box fills the pane's height under the tabs.
const columns = css({ flexDirection: 'row', flexGrow: '1' })
// T4 434:408, 434:485: on a tablet or phone the tree and the viewer are two boxes, the viewer 14 under the tree (no
// space token has 14: 12; LIBRARY_GAPS.md, Tablet item spacing).
const stacked = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// T4 434:408: the tree is a bordered box of the pane's colour, as high as its rows.
const treeBox = css({
  minW: '[0]',
  bg: 'surface.pane',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'xl',
  overflow: 'hidden',
})
// The tree's well runs the box's full height beside the viewer.
const tree = css({
  display: 'flex',
  flexDirection: 'column',
  minW: '[0]',
  bg: 'surface.well',
  '& > *': { flexGrow: '1' },
})
const treeColumn = css({ w: 'shell.sidebar', flexShrink: '0' })
const viewerColumn = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', minW: '[0]' })

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
}

export function ToolkitFileBrowser({
  browser,
  open,
  layout = 'desktop',
  onSelect,
  onCopy,
  mode,
  onModeChange,
}: ToolkitFileBrowserProps) {
  const desktop = layout === 'desktop'
  const viewer = (
    <ToolkitFileViewer
      path={open.path}
      type={open.type}
      view={open.view}
      mode={fileMode(open.view, mode)}
      onModeChange={onModeChange}
      boxed={!desktop}
      onCopy={() => {
        onCopy?.(open.path)
      }}
    />
  )
  const files = (
    <FileTree nodes={browser.tree} selected={open.path} defaultExpanded={browser.expanded} onSelect={onSelect} />
  )
  if (!desktop)
    return (
      <div className={stacked}>
        <div className={treeBox} data-figma="tree">
          {files}
        </div>
        {viewer}
      </div>
    )
  return (
    <div className={cx(box, columns)} data-figma="file browser">
      <div className={cx(tree, treeColumn)} data-figma="tree">
        {files}
      </div>
      <div className={viewerColumn}>{viewer}</div>
    </div>
  )
}
