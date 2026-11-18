// What the Files tab shows of a file, under the viewer's bar (D6, T4) or in the
// box of a file on its own page (T6): a script's explanation (D10 `explain`
// 440:1423, the library's ScriptExplanation), a Markdown file rendered
// (T4 `rendered markdown` 434:497) with the Rendered and Source switch under
// its text (`view toggle` 434:500), or the file's source as numbered lines
// (the library's CodeLines; a Markdown file's source is written back from its
// blocks). A step's line link shows the source (Code). Props only.
import { CodeLines, ScriptExplanation, ScrollFrame, ViewSwitch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitFileView } from '../types.ts'
import { type FileMode, fileModes, markdownSource } from './filesView.ts'
import { ToolkitMarkdownBlocks } from './ToolkitMarkdownBlocks.tsx'

// D6 432:2304: a line longer than the viewer runs past its edge (line 13, 432:2343). The code keeps its full width, so
// the ScrollFrame body around it scrolls the code sideways and takes the focus (d-107), as the preview's code does.
const codeWidth = css({ w: '[max-content]', minW: '[100%]' })
// T4 434:497: the text starts 16 under the bar and 18 in (no space token has 18: 16), and the heading, the paragraph
// and the switch are 8 apart; the box ends 16 under the switch.
const rendered = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8', p: '16' })
// T4 434:500: the switch is as wide as its two items.
const switchBox = css({ display: 'inline-flex' })
// Under a Markdown file's source the switch sits 16 in, as under the rendered text.
const sourceSwitch = css({ display: 'flex', px: '16', pb: '16' })

export type ToolkitFileBodyProps = {
  view: ToolkitFileView
  /** What the body shows (`fileMode` in blocks/filesView.ts). */
  mode: FileMode
  /** Called with the other view when the Markdown switch or a step's line link changes it. */
  onModeChange?: ((mode: FileMode) => void) | undefined
  /** Names the explanation's Figma layer (`explain`); a box around the body names it instead (T6). */
  explainLayer?: boolean | undefined
}

export function ToolkitFileBody({ view, mode, onModeChange, explainLayer = true }: ToolkitFileBodyProps) {
  const modes = fileModes(view)
  const markdown = modes.some((m) => m.value === 'rendered')
  const toggle = markdown ? (
    <span className={switchBox} data-figma="view toggle">
      <ViewSwitch
        label="View"
        size="md"
        tone="accent"
        items={modes}
        value={mode}
        onValueChange={(value) => {
          onModeChange?.(value === 'code' ? 'code' : 'rendered')
        }}
      />
    </span>
  ) : null
  if (mode === 'explain' && view.explain !== undefined)
    return (
      <div data-figma={explainLayer ? 'explain' : undefined}>
        <ScriptExplanation
          summary={view.explain.summary}
          facts={view.explain.facts}
          steps={view.explain.steps}
          note={view.explain.note}
          onLineSelect={() => {
            onModeChange?.('code')
          }}
        />
      </div>
    )
  if (mode === 'rendered')
    return (
      <div className={rendered} data-figma="rendered markdown">
        <ToolkitMarkdownBlocks blocks={view.blocks} padding="none" />
        {toggle}
      </div>
    )
  const code = view.code
  // A view with neither code nor blocks draws the empty file as the viewer always has.
  if (code === undefined && !markdown) return <ToolkitMarkdownBlocks blocks={view.blocks} />
  const lines = code === undefined ? markdownSource(view.blocks) : code.map((line) => line.map((p) => p.text).join(''))
  return (
    <>
      <div data-figma="code">
        <ScrollFrame>
          <div className={codeWidth}>
            <CodeLines lines={lines} segments={code} />
          </div>
        </ScrollFrame>
      </div>
      {toggle === null ? null : <div className={sourceSwitch}>{toggle}</div>}
    </>
  )
}
