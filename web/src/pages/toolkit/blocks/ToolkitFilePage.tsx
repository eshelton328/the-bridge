// A file on a page of its own, on the Files tab of a tablet or phone (T6
// 440:1698): a script with an explanation opens so, since Explain needs the
// item's width. Under the tabs the Explain and Code switch (`mode row`
// 440:1918), then the file in a bordered box: the explanation (`explain`
// 440:1925) or the source (`ToolkitFileBody`). The item's header names the
// file and the back row goes back to the tree (`ToolkitItem`). On the phone
// (M6 435:290) every file with a view opens so: under the tabs the file's
// meta line, the switch, then on Code the line on what uses the file after
// Read-only, the source in a box with its long lines wrapped, and the line
// under it. Props only.
import { CodeLines, LockIcon, ViewSwitch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitFileView } from '../types.ts'
import { type FileMode, fileModes } from './filesView.ts'
import { ToolkitFileBody } from './ToolkitFileBody.tsx'

// T6 440:1918, 440:1925: the switch's row starts 14 under the tabs and the box 14 under the row (no space token has 14:
// 12; LIBRARY_GAPS.md, Tablet item spacing).
const page = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// T6 440:1918: the row spans the item, the switch at its start. The phone (M6) has no layer for the row, only the switch.
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

// M6 435:497, 435:498, 435:555: the meta line, the read-only line and the line under the code, 12 apart with the
// switch and the code box between them.
const metaLine = css({ alignSelf: 'flex-start', textStyle: 'mono', color: 'fg.muted' })
const readOnly = css({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '8',
  textStyle: 'small',
  color: 'fg.muted',
})
const footnote = css({ textStyle: 'small', color: 'fg.muted' })
// M8 440:1630: on the phone the explanation starts at the item's edge, the overview card (440:1631), WALKTHROUGH
// (440:1643) and the steps (440:1644) 12 apart; each step's line link (`line link` 440:1648) sits under its text, 4
// under it and at the text's start, and the steps are 10 apart. `ScriptExplanation` pads 20, puts its parts 16 apart,
// its steps 12 apart and each line link at the step's end, with no prop for a narrow layout, so its slots are
// restyled here (LIBRARY_GAPS.md, Script explanation).
const phoneExplain = css({
  '& .script-explanation__root': { p: '0', gap: '12' },
  '& .script-explanation__steps': { gap: '10' },
  '& .script-explanation__step': {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    columnGap: '10',
    rowGap: '4',
  },
  '& .script-explanation__lineLink': { gridColumn: '2', justifySelf: 'start' },
})

export type ToolkitFilePageProps = {
  view: ToolkitFileView
  /** What the box shows (`fileMode` in blocks/filesView.ts). */
  mode: FileMode
  /** Called with Explain or Code when the switch or a step's line link changes the view. */
  onModeChange?: ((mode: FileMode) => void) | undefined
  layout?: Viewport | undefined
}

export function ToolkitFilePage({ view, mode, onModeChange, layout = 'tablet' }: ToolkitFilePageProps) {
  const modes = fileModes(view)
  const phone = layout === 'phone'
  // M6 435:503: on the phone the source wraps its long lines in a box as wide as the item, with nothing to scroll.
  const phoneCode =
    phone && mode === 'code' && view.code !== undefined ? (
      <>
        {view.usedBy === undefined ? null : (
          <p className={readOnly} data-figma="read-only">
            <LockIcon size="12" />
            {`Read-only. ${view.usedBy.text}`}
          </p>
        )}
        <div className={box} data-figma="code">
          <CodeLines lines={view.code.map((line) => line.map((p) => p.text).join(''))} segments={view.code} wrap />
        </div>
        {view.footnote === undefined ? null : <p className={footnote}>{view.footnote}</p>}
      </>
    ) : null
  return (
    <div className={page}>
      {phone && view.meta !== undefined ? <span className={metaLine}>{view.meta}</span> : null}
      {modes.some((m) => m.value === 'explain') ? (
        <div className={modeRow} data-figma={phone ? undefined : 'mode row'}>
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
      {phone && mode === 'explain' ? (
        // M8 440:1630: on the phone the explanation has no box around it.
        <div className={phoneExplain}>
          <ToolkitFileBody view={view} mode={mode} onModeChange={onModeChange} />
        </div>
      ) : (
        (phoneCode ?? (
          <div className={box} data-figma={mode === 'explain' ? 'explain' : undefined}>
            <ToolkitFileBody view={view} mode={mode} onModeChange={onModeChange} explainLayer={false} />
          </div>
        ))
      )}
    </div>
  )
}
