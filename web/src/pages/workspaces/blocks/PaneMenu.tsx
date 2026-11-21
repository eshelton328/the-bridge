// A pane's menu (D1 105:421): fork the chat, open a side chat, start a
// subtask, move the chat to another workspace (its list opens beside the
// row, 105:473, as the move action's `submenu`), rename the chat or close
// the pane. The chat shown alone has the same menu behind the ⋯ of its
// header (D2b 402:5486), with New chat, Subagents and Folders, and no Close
// pane. Both use the compact row pitch, and a state can set the highlighted
// row and workspace. A live Claude chat's /compact and /clear come last,
// after a separator, on only while it is idle or done (W5). A live chat's
// pane adds Focus in terminal, Zoom pane or Unzoom pane and Swap with…, whose list of the other
// chats of its herdr tab is the row's submenu, before Close pane… (W2,
// layoutActions.ts). Props only.
import {
  BranchIcon,
  Button,
  BubbleIcon,
  CloseCircleIcon,
  CloseIcon,
  EditIcon,
  GridIcon,
  MaximizeIcon,
  Menu,
  type MenuEntry,
  MoreIcon,
  MoveIcon,
  PlusIcon,
  ProjectsIcon,
  SortIcon,
  SparkleIcon,
  SplitIcon,
  TerminalIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'
import type { ReactElement, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { PaneAction, Workspace } from '../types.ts'

// A menu row draws its icon in fg.muted; Figma draws the Subagents icon in the accent colour (D2b 402:5553).
const accentIcon = css({ display: 'inline-flex', '& svg': { color: 'fg.accent' } })

const icons: Record<PaneAction['value'], ReactNode> = {
  newChat: <PlusIcon size="16" />,
  fork: <BranchIcon size="16" />,
  sideChat: <BubbleIcon size="16" />,
  subtask: <SparkleIcon size="16" />,
  subagents: (
    <span className={accentIcon}>
      <WorkspacesIcon size="16" />
    </span>
  ),
  folders: <ProjectsIcon size="16" />,
  move: <MoveIcon size="16" />,
  rename: <EditIcon size="16" />,
  close: <CloseIcon size="16" />,
  // W5: the library has no icon for compacting or clearing a context (LIBRARY_GAPS.md: Chat commands).
  compact: <SortIcon size="16" />,
  clear: <CloseCircleIcon size="16" />,
  // W2: the library has no unzoom (restore) or swap icon (LIBRARY_GAPS.md: Layout writes).
  focus: <TerminalIcon size="16" />,
  zoom: <MaximizeIcon size="16" />,
  unzoom: <GridIcon size="16" />,
  swap: <SplitIcon size="16" />,
}

/** The value of a chat in Swap with…'s list: it must differ from the menu's own values. */
const swapValue = (chat: string) => `swap:${chat}`

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
  /** The highlighted row of the menu, such as `move` while its list is open; the menu keeps its own when not set. */
  highlighted?: string | null | undefined
  onHighlightChange?: ((value: string | null) => void) | undefined
  /** The highlighted workspace of the Move to workspace list; the list keeps its own when not set. */
  moveTarget?: string | null | undefined
  onMoveTargetChange?: ((workspace: string | null) => void) | undefined
  onSelect?: ((action: string) => void) | undefined
  onMove?: ((workspace: string) => void) | undefined
  /** The action the separator goes before; `move` when not set. */
  separatorBefore?: PaneAction['value'] | undefined
  /** The button that opens the menu; the pane header's ⋯ when not set. */
  trigger?: ReactElement | undefined
  /** The Figma layer of the open menu, for the fidelity checks; D1's when not set. */
  figma?: { menu?: string | undefined } | undefined
  /** The chats Swap with… lists (W2): the other chats of the pane's herdr tab, by id, with their names. */
  swapTargets?: readonly { readonly id: string; readonly title: string }[] | undefined
  /** Called with the chat picked in Swap with…'s list. */
  onSwap?: ((chat: string) => void) | undefined
}

export function PaneMenu(props: PaneMenuProps) {
  const { title, actions, targets, newWorkspace, open, onOpenChange, moveOpen, onMoveOpenChange } = props
  const separatorBefore = props.separatorBefore ?? 'move'
  const moveItems: MenuEntry[] = [
    ...targets.map((w) => ({ value: w.id, label: w.label, icon: <GridIcon size="16" /> })),
    { type: 'separator' },
    { value: 'new', label: newWorkspace, icon: <PlusIcon size="16" /> },
  ]
  // A pick in the list reaches the menu's onSelect: a workspace (or New workspace) moves the chat.
  const moveValues = new Set([...targets.map((w) => w.id), 'new'])
  const swapItems: MenuEntry[] = (props.swapTargets ?? []).map((c) => ({ value: swapValue(c.id), label: c.title }))
  const swapChats = new Map((props.swapTargets ?? []).map((c) => [swapValue(c.id), c.id]))
  const select = (value: string) => {
    const swapWith = swapChats.get(value)
    if (swapWith !== undefined) props.onSwap?.(swapWith)
    else if (moveValues.has(value)) props.onMove?.(value)
    else props.onSelect?.(value)
  }
  // A live chat's layout actions (W2) start their own group after a separator: Focus in terminal, Zoom or Unzoom, Swap
  // with…, Close pane….
  const layoutStart = actions.find(
    (a) => a.value === 'focus' || a.value === 'zoom' || a.value === 'unzoom' || a.value === 'swap',
  )?.value
  const items: MenuEntry[] = actions.flatMap((a): MenuEntry[] => {
    const entry = {
      value: a.value,
      label: a.label,
      icon: icons[a.value],
      disabled: a.disabled,
      submenu:
        a.value === 'swap'
          ? { items: swapItems }
          : a.value === 'move'
            ? {
                items: moveItems,
                open: moveOpen,
                onOpenChange: onMoveOpenChange,
                highlightedValue: props.moveTarget,
                onHighlightChange: props.onMoveTargetChange,
              }
            : undefined,
    }
    // A live Claude chat's commands follow the other actions after their own separator (W5, chatCommands.ts).
    return a.value === separatorBefore || a.value === 'compact' || a.value === layoutStart
      ? [{ type: 'separator' }, entry]
      : [entry]
  })
  return (
    <Menu
      data-figma={open ? (props.figma?.menu ?? '105:421') : undefined}
      open={open}
      onOpenChange={onOpenChange}
      onSelect={select}
      placement="bottom-end"
      width="sm"
      density="compact"
      highlightedValue={props.highlighted}
      onHighlightChange={props.onHighlightChange}
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
