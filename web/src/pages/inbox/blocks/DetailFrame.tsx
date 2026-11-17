// The frame of a next step or a question (d-107): Back stays at the top on a tablet or phone, the pinned bar (Start, the
// answer or a started task's run card) at the bottom, and only the item between them scrolls. Back and the item each
// sit in the detail's Container, which pads Back at the top and the item at the bottom, so at the top of the scroll
// each layer keeps the place it had in one Container. Props only.
import { Container, ScrollFrame } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'

const noBottom = css({ pb: '0' })
const noTop = css({ pt: '0' })

export type DetailFrameProps = {
  layout: Viewport
  /** Back, at the top on a tablet or phone. */
  back?: ReactNode
  /** The bar pinned at the bottom, such as Start on the phone. */
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
      footer={footer}
    >
      <Container size={size} className={back === undefined ? undefined : noTop}>
        {children}
      </Container>
    </ScrollFrame>
  )
}
