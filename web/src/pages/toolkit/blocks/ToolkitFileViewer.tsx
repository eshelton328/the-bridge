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
// The library's FileFrame draws the box, the bar and the line under it
// (`variant="flush"` beside the tree, `box` on a tablet or phone). Props only.
import {
  AgentIcon,
  FileFrame,
  HookIcon,
  RuleIcon,
  SkillIcon,
  ViewSwitch,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitFileView } from '../types.ts'
import { type FileMode, fileModes } from './filesView.ts'
import { ToolkitFileBody } from './ToolkitFileBody.tsx'

// D10 440:1418: the switch sits 8 before the copy icon; its box is the switch's own.
const switchBox = css({ display: 'inline-flex' })
// D6 432:2347: the skill icon 14 in and the line in small muted text, 8 after it, 10 under the code. Figma puts it right
// under the file; FileFrame's `foot` sits at the foot of a column that fills the browser's height, so the line is drawn
// in the body under the file (LIBRARY_GAPS.md, File browser).
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
  // D6 432:2290 to 432:2347: the bar with the copy icon (none on a tablet or phone, T4) and Read-only, the file, and
  // the line on what uses it with its kind's 12 px icon (Figma 13; icon.12, d-100).
  return (
    <FileFrame
      variant={inBox ? 'box' : 'flush'}
      name={path}
      icon={type}
      meta={view?.meta}
      actions={
        explain ? (
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
        ) : undefined
      }
      onCopy={
        inBox
          ? undefined
          : () => {
              onCopy?.()
            }
      }
      readOnly
      figma={{ root: 'viewer', bar: 'viewer bar' }}
    >
      {view === undefined ? null : <ToolkitFileBody view={view} mode={mode} onModeChange={onModeChange} line={line} />}
      {view?.usedBy === undefined ? null : (
        <p className={usedBy} data-figma="used by">
          {kindIcons[view.usedBy.kind]}
          {view.usedBy.text}
        </p>
      )}
    </FileFrame>
  )
}
