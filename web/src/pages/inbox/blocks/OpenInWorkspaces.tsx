// Open in Workspaces: the button that opens a started task's chat on the
// Workspaces page (D5, D6, T4, M10 notes). That page is not built and no
// Inbox frame draws where the button goes, so it is disabled
// (`aria-disabled`, which keeps it in the tab order): its title says why, as
// its accessible description and the browser's tooltip, and a press does
// nothing. Props only.
import { Button, ExternalLinkIcon } from '@eshelton328/component-library-1701'
import type { ComponentProps } from 'react'

/** Why the button does nothing yet: its title. */
const workspacesWaiting = 'Workspaces is not built yet'

export type OpenInWorkspacesProps = {
  /** The label, such as "Open in Workspaces", or "Workspaces" in the nav of a tablet or phone. */
  label: string
  size?: ComponentProps<typeof Button>['size']
  /** The label's type: `xs` (Medium 12) in the chat header's nav (T5 346:6377, M8 346:10847), `sm` (Medium 13) on
      the run card (T4 346:6303). */
  textSize?: ComponentProps<typeof Button>['textSize']
  /** The Figma layer the button stands for. */
  figma?: string | undefined
}

export function OpenInWorkspaces({ label, size, textSize, figma }: OpenInWorkspacesProps) {
  return (
    <Button size={size} textSize={textSize} aria-disabled="true" title={workspacesWaiting} data-figma={figma}>
      <ExternalLinkIcon />
      {label}
    </Button>
  )
}
