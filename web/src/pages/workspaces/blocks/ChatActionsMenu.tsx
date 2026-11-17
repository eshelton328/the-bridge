// The chat actions behind the ⋯ of a chat shown alone (D2b 402:5486): New
// chat, Fork, Side chat, Subtask, then Subagents, Folders, Move to workspace
// and Rename chat. It is the pane menu with the header's ⋯ as its trigger,
// pressed while the menu is open. Props only.
import { Button, MoreIcon } from '@eshelton328/component-library-1701'
import type { PaneAction, Workspace } from '../types.ts'
import { PaneMenu } from './PaneMenu.tsx'

export type ChatActionsMenuProps = {
  title: string
  actions: readonly PaneAction[]
  /** The workspaces a chat can move to: every one but its own. */
  targets: readonly Workspace[]
  newWorkspace: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  moveOpen: boolean
  onMoveOpenChange?: ((open: boolean) => void) | undefined
  /** The highlighted row and the highlighted workspace of Move to workspace's list, as on `PaneMenu`. */
  highlighted?: string | null | undefined
  onHighlightChange?: ((value: string | null) => void) | undefined
  moveTarget?: string | null | undefined
  onMoveTargetChange?: ((workspace: string | null) => void) | undefined
  /** The Figma layers of the ⋯ and of the open menu, for the fidelity checks; D2's ⋯ when not set. */
  figma?: { trigger?: string | undefined; menu?: string | undefined } | undefined
}

export function ChatActionsMenu({ figma, ...props }: ChatActionsMenuProps) {
  return (
    <PaneMenu
      {...props}
      separatorBefore="subagents"
      figma={{ menu: figma?.menu }}
      trigger={
        <Button
          size="xs"
          pressed={props.open}
          aria-label={`${props.title} actions`}
          data-figma={figma?.trigger ?? '400:2'}
        >
          <MoreIcon size="12" />
        </Button>
      }
    />
  )
}
