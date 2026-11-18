// The frame of a next step or a question (d-107): Back stays at the top on a tablet or phone, and only the item under
// it scrolls. The pinned bar (Start, the answer or a started task's run card) is sticky at the bottom of the scrolling
// item, so it stays in view and the item scrolls under it, as Figma draws My notes under Start (M2). Back and the item
// each sit in the detail's Container, which pads Back at the top and the item at the bottom, so at the top of the
// scroll each layer keeps the place it had in one Container. On a tablet or phone the frame must be the AppShell
// detail's own child: with `tabBarOverlay` it then reaches under the tab bar and lifts the pinned bar and the end of
// the item above it. Props only.
import { Container, ScrollFrame } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css, cx } from '../../styled-system/css/index.js'
import { detailContainerSize } from '../lib/containerSize.ts'
import type { Viewport } from '../lib/screenState.ts'

const noBottom = css({ pb: '0' })
const noTop = css({ pt: '0' })
// The item fills the body, so a short item still puts the pinned bar at the bottom of the screen.
const fill = css({ flex: '1' })

export type DetailFrameProps = {
  layout: Viewport
  /** Back, at the top on a tablet or phone. */
  back?: ReactNode
  /**
   * The bar pinned at the bottom, such as Start on the phone. It must be `position: sticky` at
   * `bottom: var(--scroll-frame-inset, 0px)`, so it sticks above a tab bar that lies over the page.
   */
  footer?: ReactNode
  /** The item. */
  children: ReactNode
}

export function DetailFrame({ layout, back, footer, children }: DetailFrameProps) {
  const size = detailContainerSize(layout)
  return (
    <ScrollFrame
      header={
        back === undefined ? undefined : (
          <Container size={size} className={noBottom}>
            {back}
          </Container>
        )
      }
    >
      <Container size={size} className={cx(fill, back === undefined ? undefined : noTop)}>
        {children}
      </Container>
      {footer}
    </ScrollFrame>
  )
}
