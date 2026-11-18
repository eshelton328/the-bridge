// Open in Workbench: the button that moves an item's discussion into a
// workspace, where it can change files (D5 438:9, T5 464:393, M7 464:228). The
// Workbench has no state that takes a toolkit discussion, and no Toolkit frame
// draws where the chat lands, so the button is disabled (`aria-disabled`,
// which keeps it in the tab order): its title says why, as its accessible
// description and the browser's tooltip, and a press does nothing, as the
// Inbox's Open in Workspaces. Props only.
import { Button, ExternalLinkIcon } from '@eshelton328/component-library-1701'
import type { ComponentProps } from 'react'

/** Why the button does nothing yet: its title. */
const workbenchWaiting = 'The Workbench cannot take a toolkit discussion yet'

export type ToolkitOpenInWorkbenchProps = {
  /** The label: "Open in Workbench", or "Workbench" on the phone (M7). */
  label: string
  /** `md` in the desktop panel's header (D5, 34 high), `xs` in the nav of a tablet or phone (T5, M7, 22 high). */
  size?: ComponentProps<typeof Button>['size']
  textSize?: ComponentProps<typeof Button>['textSize']
}

export function ToolkitOpenInWorkbench({ label, size, textSize }: ToolkitOpenInWorkbenchProps) {
  return (
    <Button
      size={size}
      textSize={textSize}
      aria-disabled="true"
      title={workbenchWaiting}
      data-figma="button · Open in Workbench"
    >
      <ExternalLinkIcon />
      {label}
    </Button>
  )
}
