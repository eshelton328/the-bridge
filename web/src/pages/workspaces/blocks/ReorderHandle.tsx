// A workspace's drag handle in the live edit mode (reviews R41, R42): the
// grip M2 draws before the chevron (105:2516), as a button the owner drags
// to move the workspace, or focuses and moves with the arrow keys. The
// fixture edit mode draws the grip alone (PhoneEditGroup). It takes no
// touch scroll, so a drag on a phone moves the workspace and not the list.
// Props only.
import { Button, GripIcon } from '@eshelton328/component-library-1701'
import type { KeyboardEvent, PointerEvent } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// As the header's other buttons: 24 high in the 28 px header, in the header's grey (M2 105:2530), and the grip's
// subtle colour (105:2605). A touch on it drags; it never scrolls the list.
const handle = css({ color: 'fg.subtle', my: '-4', ms: '-6', touchAction: 'none', cursor: 'grab' })

export type ReorderHandleProps = {
  /** The workspace's name, for the button's label. */
  name: string
  onPointerDown: (event: PointerEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
}

export function ReorderHandle({ name, onPointerDown, onKeyDown }: ReorderHandleProps) {
  return (
    <Button
      variant="text"
      size="xs"
      iconOnly
      className={handle}
      aria-label={`Move ${name}`}
      aria-description="Drag, or press the up or down arrow"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <GripIcon size="12" />
    </Button>
  )
}
