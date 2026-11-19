// Move to… at the end of a chat row in edit mode (T1 105:1594): the move
// mark and the label in a small bordered button, in place of the row's
// status. It opens the chat's actions with Move to workspace's list open.
// Props only.
import { Button, MoveIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// In edit mode the row's title is a button whose hit area covers the whole row (a tap renames the chat); the button
// lies over it, so a tap on Move to… reaches it.
const overTitle = css({ position: 'relative', zIndex: '1' })

export type MoveButtonProps = {
  label: string
  /** Without it, the button draws only. */
  onMove?: (() => void) | undefined
  /** The Figma layer the button stands for, for the fidelity checks. */
  figma?: string | undefined
}

export function MoveButton({ label, onMove, figma }: MoveButtonProps) {
  return (
    // T1 105:1594: 85 × 22, the 12 px mark (105:1595) and the 12 px label. `Button size="xs" textSize="xs"` is 24
    // high (control.xs); `keepIconSize` keeps the mark at 12, as the library draws every other icon at 16.
    <Button
      size="xs"
      textSize="xs"
      keepIconSize
      className={overTitle}
      data-figma={figma}
      onClick={
        onMove === undefined
          ? undefined
          : (event) => {
              // The button opens the actions, not the chat's name field under it.
              event.stopPropagation()
              onMove()
            }
      }
    >
      <MoveIcon size="12" />
      {label}
    </Button>
  )
}
