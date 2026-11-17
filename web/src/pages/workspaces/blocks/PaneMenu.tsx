// A pane's menu (D1 105:421): fork the chat, open a side chat, start a
// subtask, move the chat to another workspace (its list opens beside the
// row, 105:473), rename the chat or close the pane. The chat shown alone
// has the same menu behind the ⋯ of its header (D2b 402:5486), with New
// chat, Subagents and Folders, and no Close pane. The menu has no
// submenu (LIBRARY_GAPS.md), so the list is a second Menu whose trigger is
// the row's chevron. Props only.
import {
  BranchIcon,
  Button,
  BubbleIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  GridIcon,
  Menu,
  type MenuEntry,
  MoreIcon,
  MoveIcon,
  PlusIcon,
  ProjectsIcon,
  SparkleIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'
import type { ReactElement, ReactNode } from 'react'
import type { PaneAction, Workspace } from '../types.ts'

const icons: Record<PaneAction['value'], ReactNode> = {
  newChat: <PlusIcon size="16" />,
  fork: <BranchIcon size="16" />,
  sideChat: <BubbleIcon size="16" />,
  subtask: <SparkleIcon size="16" />,
  subagents: <WorkspacesIcon size="16" />,
  folders: <ProjectsIcon size="16" />,
  move: <MoveIcon size="16" />,
  rename: <EditIcon size="16" />,
  close: <CloseIcon size="16" />,
}

export type PaneMenuProps = {
  title: string
  actions: readonly PaneAction[]
  /** The workspaces a chat can move to: every one but the current. */
  targets: readonly Workspace[]
  newWorkspace: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  moveOpen: boolean
  onMoveOpenChange?: ((open: boolean) => void) | undefined
  onSelect?: ((action: string) => void) | undefined
  onMove?: ((workspace: string) => void) | undefined
  /** The action the separator goes before; `move` when not set. */
  separatorBefore?: PaneAction['value'] | undefined
  /** The button that opens the menu; the pane header's ⋯ when not set. */
  trigger?: ReactElement | undefined
  /** The Figma layers of the open menu and of the open list, for the fidelity checks; D1's when not set. */
  figma?: { menu?: string | undefined; move?: string | undefined } | undefined
}

export function PaneMenu(props: PaneMenuProps) {
  const { title, actions, targets, newWorkspace, open, onOpenChange, moveOpen, onMoveOpenChange } = props
  const separatorBefore = props.separatorBefore ?? 'move'
  const move = (
    <Menu
      data-figma={moveOpen ? (props.figma?.move ?? '105:473') : undefined}
      open={moveOpen}
      onOpenChange={onMoveOpenChange}
      onSelect={props.onMove}
      trigger={
        <span role="button" aria-label="Workspaces">
          <ChevronRightIcon size="12" />
        </span>
      }
      items={[
        ...targets.map((w) => ({ value: w.id, label: w.label, icon: <GridIcon size="16" /> })),
        { type: 'separator' },
        { value: 'new', label: newWorkspace, icon: <PlusIcon size="16" /> },
      ]}
    />
  )
  const items: MenuEntry[] = actions.flatMap((a): MenuEntry[] => {
    const entry = {
      value: a.value,
      label: a.label,
      icon: icons[a.value],
      trailing: a.value === 'move' ? move : undefined,
    }
    return a.value === separatorBefore ? [{ type: 'separator' }, entry] : [entry]
  })
  return (
    <Menu
      data-figma={open ? (props.figma?.menu ?? '105:421') : undefined}
      open={open}
      onOpenChange={onOpenChange}
      onSelect={props.onSelect}
      placement="bottom-end"
      width="sm"
      trigger={
        props.trigger ?? (
          <Button variant="text" size="xs" iconOnly aria-label={`${title} actions`}>
            <MoreIcon size="16" />
          </Button>
        )
      }
      items={items}
    />
  )
}
