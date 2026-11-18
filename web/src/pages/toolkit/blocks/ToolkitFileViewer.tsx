// The Files tab's viewer (Figma `viewer`, D6 432:2290): the selected file
// read-only beside the tree. Its bar (432:2291) holds the code or file icon,
// the file's path in the item, text after it such as its language and length,
// then a copy button and Read-only at its end; under it the file's first lines
// with their numbers (the library's CodeLines) or its blocks rendered
// (`ToolkitMarkdownBlocks`), and a line on what uses the file (`used by`,
// 432:2347). A file the state has no view of shows its bar only. Props only.
import {
  AgentIcon,
  CodeIcon,
  CodeLines,
  CopyIcon,
  FileIcon,
  HookIcon,
  LockIcon,
  RuleIcon,
  ScrollFrame,
  SkillIcon,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitFileView } from '../types.ts'
import { ToolkitMarkdownBlocks } from './ToolkitMarkdownBlocks.tsx'

// D6 432:2290: the viewer fills the browser's column beside the tree, as high as the tree.
const viewer = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', minW: '[0]', bg: 'surface.pane' })
// D6 432:2291: 37 high, the code icon 14 in, the path in mono 8 after it, its meta 8 after that, and the copy icon,
// the lock and Read-only at the end, as the Overview's preview bar (D3 427:274) draws them.
const bar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  px: '12',
  py: '10',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
  color: 'fg.muted',
})
const name = css({ textStyle: 'mono', color: 'fg.default', whiteSpace: 'nowrap', flexShrink: '0' })
const fileMeta = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', minW: '[0]' })
const end = css({ display: 'inline-flex', alignItems: 'center', gap: '8', ms: 'auto', flexShrink: '0' })
const readOnly = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8',
  textStyle: 'small',
  whiteSpace: 'nowrap',
})
// D6 432:2297: the copy icon is a bare 12 px icon, as the path badge's (D3 457:50); the library's smallest button is 24
// high (LIBRARY_GAPS.md, Path badge copy button).
const copy = css({
  display: 'inline-flex',
  p: '0',
  color: 'fg.muted',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
// D6 432:2304: a line longer than the viewer runs past its edge (line 13, 432:2343). The code keeps its full width, so
// the ScrollFrame body around it scrolls the code sideways and takes the focus (d-107), as the preview's code does.
const codeWidth = css({ w: '[max-content]', minW: '[100%]' })
// D6 432:2347: the skill icon 14 in and the line in small muted text, 8 after it, 10 under the code.
const usedBy = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  px: '12',
  py: '10',
  textStyle: 'small',
  color: 'fg.muted',
})

const kindIcons = {
  skill: <SkillIcon size="12" />,
  agent: <AgentIcon size="12" />,
  rule: <RuleIcon size="12" />,
  workflow: <WorkflowIcon size="12" />,
  hook: <HookIcon size="12" />,
}

export type ToolkitFileViewerProps = {
  /** The file's path in the item, such as "scripts/check"; the bar shows it. */
  path: string
  /** A script (`code`, D6 432:2292) or another file. */
  type: 'file' | 'code'
  /** What the viewer shows of the file; its bar only when not set. */
  view?: ToolkitFileView | undefined
  /** Called when the bar's copy button is pressed. */
  onCopy?: (() => void) | undefined
}

export function ToolkitFileViewer({ path, type, view, onCopy }: ToolkitFileViewerProps) {
  const code = view?.code
  // Each line's text, from its coloured pieces.
  const lines = (code ?? []).map((line) => line.map((piece) => piece.text).join(''))
  return (
    <section aria-label={path} className={viewer} data-figma="viewer">
      <div className={bar} data-figma="viewer bar">
        {type === 'code' ? <CodeIcon size="16" /> : <FileIcon size="16" />}
        <span className={name}>{path}</span>
        {view?.meta === undefined ? null : <span className={fileMeta}>{view.meta}</span>}
        <span className={end}>
          <button type="button" className={copy} aria-label={`Copy ${path}`} onClick={onCopy}>
            <CopyIcon size="12" />
          </button>
          <span className={readOnly}>
            <LockIcon size="12" />
            Read-only
          </span>
        </span>
      </div>
      {view === undefined ? null : code === undefined ? (
        <ToolkitMarkdownBlocks blocks={view.blocks} />
      ) : (
        <div data-figma="code">
          <ScrollFrame>
            <div className={codeWidth}>
              <CodeLines lines={lines} segments={code} />
            </div>
          </ScrollFrame>
        </div>
      )}
      {view?.usedBy === undefined ? null : (
        <p className={usedBy} data-figma="used by">
          {kindIcons[view.usedBy.kind]}
          {view.usedBy.text}
        </p>
      )}
    </section>
  )
}
