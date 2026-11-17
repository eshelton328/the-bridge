// A frame that fills its parent, measures its own width and renders its
// content for the layout of that width (lib/viewport.ts): desktop, tablet
// or phone. A page screen sits in it, so the same state lays out by the
// width it gets, in the app, in Storybook and on a canvas board, and never
// by a prop a story sets. Until the first measure, `initial` applies.
import { type ReactNode, useCallback, useState } from 'react'
import { css } from '../../styled-system/css/index.js'
import type { Viewport } from '../lib/screenState.ts'
import { viewportForWidth } from '../lib/viewport.ts'

const frame = css({ display: 'flex', flexDirection: 'column', w: '[100%]', h: '[100%]' })

export type ViewportFrameProps = {
  /** The layout before the frame is measured, such as the canvas board's frame size. */
  initial: Viewport
  children: (viewport: Viewport) => ReactNode
}

export function ViewportFrame({ initial, children }: ViewportFrameProps) {
  const [viewport, setViewport] = useState<Viewport>(initial)
  const measure = useCallback((element: HTMLDivElement | null) => {
    if (element === null) return undefined
    const update = () => {
      // The layout width, before any transform: a canvas board zoomed out to half draws a 1512 px frame 756 wide.
      setViewport(viewportForWidth(element.offsetWidth))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])
  return (
    <div ref={measure} className={frame}>
      {children(viewport)}
    </div>
  )
}
