// The only file that renders the library's Pane (the lint enforces it), so
// every pane gets a PaneBoundary by construction.
import { Pane, type PaneProps } from '@eshelton328/component-library-1701'
import { PaneBoundary } from './PaneBoundary.tsx'

export type PaneSlotProps = PaneProps & {
  /** What the pane shows, such as the chat id; a new key resets the boundary. */
  contentKey: string
  onClosePane?: (() => void) | undefined
}

export function PaneSlot({ contentKey, onClosePane, children, ...pane }: PaneSlotProps) {
  return (
    <Pane {...pane}>
      <PaneBoundary contentKey={contentKey} onClosePane={onClosePane}>
        {children}
      </PaneBoundary>
    </Pane>
  )
}
