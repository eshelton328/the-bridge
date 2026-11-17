// One pane of the split with its header: the kind mark, the title, the model
// and context used, the status, Maximise and the pane menu (D1 105:178).
// Props only; the screen decides which pane is focused and which menu is open.
import { ContextMeter, KindMark, MaximizeIcon, StatusPill, Button } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { PaneSlot } from '../../../errors/PaneSlot.tsx'
import type { PaneHead } from '../types.ts'

// The split's panel is a flex column; the pane fills it.
const slot = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })

export type PaneFrameProps = {
  head: PaneHead
  /** The Figma layer the pane stands for, for the fidelity checks. */
  figma: string
  focused: boolean
  onActivate?: (() => void) | undefined
  /** The pane menu, with its trigger. */
  menu: ReactNode
  children: ReactNode
}

export function PaneFrame({ head, figma, focused, onActivate, menu, children }: PaneFrameProps) {
  return (
    <div data-figma={figma} className={slot}>
      <PaneSlot
        contentKey={head.title}
        title={head.title}
        leading={<KindMark kind={head.kind} size="16" />}
        meta={
          <>
            <span>{head.model}</span>
            {head.context === undefined ? null : <ContextMeter value={head.context} />}
          </>
        }
        actions={
          <>
            <StatusPill label={head.status.label} tone={head.status.tone} dot />
            <Button variant="text" size="xs" iconOnly aria-label={`Maximise ${head.title}`}>
              <MaximizeIcon size="16" />
            </Button>
            {menu}
          </>
        }
        focused={focused}
        onActivate={onActivate}
      >
        {children}
      </PaneSlot>
    </div>
  )
}
