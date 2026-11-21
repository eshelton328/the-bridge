// One pane of the split with its header: the kind mark, the title, the model
// (with its effort, W5) and context used, the status, Maximise and the pane menu (D1 105:178).
// Props only; the screen decides which pane is focused and which menu is open.
// A live chat's pane (W2) sends a focus to herdr on a tap on its header
// (`onHeaderTap`, headerTap.ts), and Maximise zooms it, or ends the zoom
// while herdr zooms it (`zoom`), pending until the new layout comes.
// An overlay, such as the drop zone of a chat dragged over the pane (D8),
// covers the whole pane, header included.
import { ContextMeter, KindMark, MaximizeIcon, StatusPill, Button } from '@eshelton328/component-library-1701'
import type { MouseEvent, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { PaneSlot } from '../../../errors/PaneSlot.tsx'
import type { PaneHead } from '../types.ts'
import { isHeaderTap } from './headerTap.ts'
import { modelText } from './modelText.ts'

// The split's panel is a flex column; the pane fills it. The pane is a size container, so a chat's long draft
// stops at half the pane (`ChatPane`); the split sets its size, so the containment changes no layout. It places the
// overlay.
const slot = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minW: '[0]',
  minH: '[0]',
  containerType: 'size',
})

export type PaneFrameProps = {
  head: PaneHead
  /** The Figma layer the pane stands for, for the fidelity checks. */
  figma: string
  focused: boolean
  onActivate?: (() => void) | undefined
  /** The pane menu, with its trigger. */
  menu: ReactNode
  children: ReactNode
  /** Drawn over the whole pane, such as the drop zone of a dragged chat (D8 402:1112). */
  overlay?: ReactNode
  /** A tap or click on the header itself, not on a button in it (W2): the page focuses the chat in herdr. */
  onHeaderTap?: (() => void) | undefined
  /**
   * Maximise as the live chat's zoom (W2): `zoomed` herdr zooms this pane, so the button ends the zoom; `pending` a zoom
   * waits for the new layout. Not set, Maximise draws only, as on a fixture or a tab of one pane.
   */
  zoom?: { readonly zoomed: boolean; readonly pending: boolean; readonly onToggle: () => void } | undefined
}

export function PaneFrame({
  head,
  figma,
  focused,
  onActivate,
  menu,
  children,
  overlay,
  onHeaderTap,
  zoom,
}: PaneFrameProps) {
  // The header is the first child of the library pane's section.
  const tap =
    onHeaderTap === undefined
      ? undefined
      : (event: MouseEvent<HTMLDivElement>) => {
          if (isHeaderTap(event.target, event.currentTarget.querySelector('section')?.firstElementChild)) onHeaderTap()
        }
  return (
    <div data-figma={figma} className={slot} onClick={tap}>
      <PaneSlot
        contentKey={head.title}
        title={head.title}
        leading={<KindMark kind={head.kind} size="16" />}
        meta={
          <>
            <span>{modelText(head)}</span>
            {head.context === undefined ? null : <ContextMeter value={head.context} />}
          </>
        }
        actions={
          <>
            <StatusPill label={head.status.label} tone={head.status.tone} dot />
            {zoom?.zoomed === true ? (
              // While herdr zooms the pane, the button ends the zoom, pressed as a toggle that is on.
              <Button
                variant="secondary"
                size="xs"
                iconOnly
                pressed
                aria-label={`Unzoom ${head.title}`}
                disabled={zoom.pending}
                aria-busy={zoom.pending}
                onClick={zoom.onToggle}
              >
                <MaximizeIcon size="16" />
              </Button>
            ) : (
              <Button
                variant="text"
                size="xs"
                iconOnly
                aria-label={`Maximise ${head.title}`}
                disabled={zoom?.pending}
                aria-busy={zoom?.pending}
                onClick={zoom?.onToggle}
              >
                <MaximizeIcon size="16" />
              </Button>
            )}
            {menu}
          </>
        }
        focused={focused}
        onActivate={onActivate}
      >
        {children}
      </PaneSlot>
      {overlay}
    </div>
  )
}
