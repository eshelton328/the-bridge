// One screen of a page with its Desktop, Tablet and Phone states side by
// side (screen review R10). Each device shows its state's own story in an
// iframe of the Figma frame size, so the screen lays out, opens its
// popovers and measures its width as in that story. All frames take one
// scale, so their sizes compare; the scale fits the row to the width.
// Storybook only: a page's `screens/<Page>Screens.stories.tsx` renders it.
import { useCallback } from 'react'
import { storyNameFromExport, toId } from 'storybook/internal/csf'
import { css } from '../../styled-system/css/index.js'
import { deviceLabels, frameSizes, type Screen, screenStates } from '../lib/screenMap.ts'

// The gap between two frames, as `gap: '32'` below.
const gapPx = 32

const row = css({ display: 'flex', alignItems: 'flex-start', gap: '32', p: '24', bg: 'bg.canvas', minH: '[100%]' })
const figure = css({ display: 'flex', flexDirection: 'column', gap: '8', m: '0', flexShrink: '0' })
const label = css({ textStyle: 'label', color: 'fg.muted' })
// `--screen-scale` is the measured fit of the row, set from the ref below.
const zoomed = css({ zoom: '[var(--screen-scale, 1)]', overflow: 'hidden' })
const frame = css({ display: 'block', border: '0' })

export type ScreenVariantsProps = {
  screen: Screen<string>
  /** The title of the page's per-state stories, such as 'Pages/Artifacts/States'. */
  statesTitle: string
  mode: 'dark' | 'light'
}

/** The story id of a state: its story is named after it in PascalCase (`libraryPhone` → `LibraryPhone`). */
function stateStoryId(statesTitle: string, state: string): string {
  return toId(statesTitle, storyNameFromExport(state.charAt(0).toUpperCase() + state.slice(1)))
}

export function ScreenVariants({ screen, statesTitle, mode }: ScreenVariantsProps) {
  const variants = screenStates(screen)
  const total = variants.reduce((sum, v) => sum + frameSizes[v.device].width, 0) + gapPx * (variants.length - 1)
  const measure = useCallback(
    (element: HTMLDivElement | null) => {
      if (element === null) return undefined
      const update = () => {
        const padding = Number.parseFloat(getComputedStyle(element).paddingLeft) * 2
        const fit = (element.clientWidth - padding) / total
        element.style.setProperty('--screen-scale', String(Math.min(1, Math.max(fit, 0.1))))
      }
      update()
      const observer = new ResizeObserver(update)
      observer.observe(element)
      return () => {
        observer.disconnect()
      }
    },
    [total],
  )
  return (
    <div ref={measure} className={row}>
      {variants.map(({ device, state }) => {
        const size = frameSizes[device]
        return (
          <figure key={device} className={figure}>
            <figcaption className={label}>{deviceLabels[device]}</figcaption>
            <div className={zoomed}>
              <iframe
                className={frame}
                title={`${screen.title}, ${deviceLabels[device]}`}
                src={`iframe.html?id=${stateStoryId(statesTitle, state)}&viewMode=story&globals=mode:${mode}`}
                width={size.width}
                height={size.height}
              />
            </div>
          </figure>
        )
      })}
    </div>
  )
}
