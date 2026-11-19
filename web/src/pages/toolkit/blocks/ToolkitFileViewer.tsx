// The Files tab's viewer (Figma `viewer`, D6 432:2290): the selected file
// read-only beside the tree. Its bar (432:2291) holds the code or file icon,
// the file's path in the item, text after it such as its language and length,
// then a copy button and Read-only at its end; under it the file's first lines
// with their numbers (the library's CodeLines) or its blocks rendered
// (`ToolkitMarkdownBlocks`), and a line on what uses the file (`used by`,
// 432:2347). A script with an explanation (D10 `explain` 440:1423) has the
// Explain and Code switch in its bar (`toggle · Explain | Code` 440:1418) and
// opens on Explain (the library's ScriptExplanation); a step's line link
// switches to Code. A Markdown file (T4 `viewer` 434:485) shows rendered, with
// the Rendered and Source switch under its text (`ToolkitFileBody`). On a tablet
// or phone (T4) the viewer is a bordered box of its own under the tree, and its
// bar has no copy button. A file the state has no view of shows its bar only.
// Props only.
import {
  AgentIcon,
  CodeIcon,
  CopyIcon,
  FileIcon,
  HookIcon,
  LockIcon,
  RuleIcon,
  SkillIcon,
  ViewSwitch,
  WorkflowIcon,
  focusRing,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitFileView } from '../types.ts'
import { type FileMode, fileModes } from './filesView.ts'
import { ToolkitFileBody } from './ToolkitFileBody.tsx'

// D6 432:2290: the viewer fills the browser's column beside the tree, as high as the tree.
const viewer = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', minW: '[0]', bg: 'surface.pane' })
// T4 434:485: on a tablet or phone the viewer is a bordered box under the tree, as the browser's box is on the desktop
// (LIBRARY_GAPS.md, File browser).
const boxed = css({
  display: 'flex',
  flexDirection: 'column',
  minW: '[0]',
  bg: 'surface.pane',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'xl',
  overflow: 'hidden',
})
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
// D10 440:1418: the switch sits 8 before the copy icon; its box is the switch's own.
const switchBox = css({ display: 'inline-flex' })
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
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
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
  /** How a script with an explanation shows (`fileMode` in blocks/filesView.ts); its code when not set. */
  mode?: FileMode | undefined
  /** Called with Explain or Code when the switch or a step's line link changes the view. */
  onModeChange?: ((mode: FileMode) => void) | undefined
  /** A bordered box of its own with no copy button in the bar, as on a tablet or phone (T4). */
  boxed?: boolean | undefined
  /** The line a link names (`ui.line`): the source opens at it (`ToolkitFileBody`). */
  line?: number | undefined
}

export function ToolkitFileViewer({
  path,
  type,
  view,
  onCopy,
  mode = 'code',
  onModeChange,
  boxed: inBox = false,
  line,
}: ToolkitFileViewerProps) {
  // A script's Explain and Code switch sits in the bar (D10); a Markdown file's under its text (T4).
  const modes = fileModes(view)
  const explain = modes.some((m) => m.value === 'explain')
  return (
    <section aria-label={path} className={inBox ? boxed : viewer} data-figma="viewer">
      <div className={bar} data-figma="viewer bar">
        {type === 'code' ? <CodeIcon size="16" /> : <FileIcon size="16" />}
        <span className={name}>{path}</span>
        {view?.meta === undefined ? null : <span className={fileMeta}>{view.meta}</span>}
        <span className={end}>
          {!explain ? null : (
            <span className={switchBox} data-figma="toggle · Explain | Code">
              <ViewSwitch
                label="View"
                tone="accent"
                items={modes}
                value={mode}
                onValueChange={(value) => {
                  onModeChange?.(value === 'explain' ? 'explain' : 'code')
                }}
              />
            </span>
          )}
          {inBox ? null : (
            <button type="button" className={copy} aria-label={`Copy ${path}`} onClick={onCopy}>
              <CopyIcon size="12" />
            </button>
          )}
          <span className={readOnly}>
            <LockIcon size="12" />
            Read-only
          </span>
        </span>
      </div>
      {view === undefined ? null : <ToolkitFileBody view={view} mode={mode} onModeChange={onModeChange} line={line} />}
      {view?.usedBy === undefined ? null : (
        <p className={usedBy} data-figma="used by">
          {kindIcons[view.usedBy.kind]}
          {view.usedBy.text}
        </p>
      )}
    </section>
  )
}
