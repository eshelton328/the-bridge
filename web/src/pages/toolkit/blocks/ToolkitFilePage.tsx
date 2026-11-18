// A file on a page of its own, on the Files tab of a tablet or phone (T6
// 440:1698): a script with an explanation opens so, since Explain needs the
// item's width. Under the tabs the Explain and Code switch (`mode row`
// 440:1918), then the file in a bordered box: the explanation (`explain`
// 440:1925) or the source (`ToolkitFileBody`). The item's header names the
// file and the back row goes back to the tree (`ToolkitItem`). Props only.
import { ViewSwitch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitFileView } from '../types.ts'
import { type FileMode, fileModes } from './filesView.ts'
import { ToolkitFileBody } from './ToolkitFileBody.tsx'

// T6 440:1918, 440:1925: the switch's row starts 14 under the tabs and the box 14 under the row (no space token has 14:
// 12; LIBRARY_GAPS.md, Tablet item spacing).
const page = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// T6 440:1918: the row spans the item, the switch at its start.
const modeRow = css({ display: 'flex', alignItems: 'center' })
const switchBox = css({ display: 'inline-flex' })
// T6 440:1925: the file's box, bordered as the Files tab's boxes are (LIBRARY_GAPS.md, File browser).
const box = css({
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

export type ToolkitFilePageProps = {
  view: ToolkitFileView
  /** What the box shows (`fileMode` in blocks/filesView.ts). */
  mode: FileMode
  /** Called with Explain or Code when the switch or a step's line link changes the view. */
  onModeChange?: ((mode: FileMode) => void) | undefined
}

export function ToolkitFilePage({ view, mode, onModeChange }: ToolkitFilePageProps) {
  const modes = fileModes(view)
  return (
    <div className={page}>
      {modes.some((m) => m.value === 'explain') ? (
        <div className={modeRow} data-figma="mode row">
          <span className={switchBox} data-figma="toggle · Explain | Code">
            <ViewSwitch
              label="View"
              size="md"
              tone="accent"
              items={modes}
              value={mode}
              onValueChange={(value) => {
                onModeChange?.(value === 'code' ? 'code' : 'explain')
              }}
            />
          </span>
        </div>
      ) : null}
      <div className={box}>
        <ToolkitFileBody view={view} mode={mode} onModeChange={onModeChange} />
      </div>
    </div>
  )
}
