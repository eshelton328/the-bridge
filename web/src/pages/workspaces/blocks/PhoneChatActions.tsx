// The chat actions on the phone (M4 105:2925): the sheet that the ⋯ of a
// chat's header opens, titled with the chat's name, with every action on the
// chat in one list. Subagents has a chevron to its own view; Move to
// workspace opens the other workspaces under its row (the highlighted one
// with its check, then New workspace…); Close chat comes last. The library
// has no list of actions for a sheet, so the rows are `OptionList`s with no
// check (LIBRARY_GAPS.md: Phone chat actions sheet). Props only.
import {
  BottomSheet,
  BranchIcon,
  BubbleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  GridIcon,
  MoveIcon,
  OptionList,
  type OptionListItem,
  PlusIcon,
  ProjectsIcon,
  SparkleIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'
import type { ReactElement, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { PaneAction, Workspace } from '../types.ts'

const iconBox = css({ display: 'inline-flex' })
// Figma draws the Folders and Move icons in the accent colour (M4 136:68, 105:2975) and Close chat in red (105:3026);
// under Move to workspace, the highlighted workspace's icon in the accent colour (105:2988) and the others grey.
const tones = {
  accent: css({ display: 'inline-flex', color: 'fg.accent' }),
  muted: css({ display: 'inline-flex', color: 'fg.muted' }),
  danger: css({ display: 'inline-flex', color: 'status.danger.fg' }),
}
// M4 105:2986: the workspaces sit 40 in from the action rows, under Move to workspace's label.
const nested = css({ ps: '40' })

const icons: Record<PaneAction['value'], ReactNode> = {
  newChat: <PlusIcon size="20" />,
  fork: <BranchIcon size="20" />,
  sideChat: <BubbleIcon size="20" />,
  subtask: <SparkleIcon size="20" />,
  subagents: <WorkspacesIcon size="20" />,
  folders: <ProjectsIcon size="20" />,
  move: <MoveIcon size="20" />,
  rename: <EditIcon size="20" />,
  close: <CloseIcon size="20" />,
}
const toneOf: Partial<Record<PaneAction['value'], keyof typeof tones>> = {
  folders: 'accent',
  move: 'accent',
  close: 'danger',
}

function Icon({
  layer,
  tone,
  children,
}: {
  layer?: string | undefined
  tone?: keyof typeof tones | undefined
  children: ReactNode
}) {
  return (
    <span className={tone === undefined ? iconBox : tones[tone]} data-figma={layer}>
      {children}
    </span>
  )
}

export type PhoneChatActionsProps = {
  /** The chat's name: the sheet's title. */
  title: string
  actions: readonly PaneAction[]
  /** The workspaces the chat can move to: every one but its own. */
  targets: readonly Workspace[]
  newWorkspace: string
  /** The ⋯ that opens the sheet. */
  trigger: ReactElement
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Move to workspace's list is open under its row. */
  moveOpen: boolean
  onMoveOpenChange?: ((open: boolean) => void) | undefined
  /** The highlighted workspace of that list; it shows its check. */
  moveTarget?: string | null | undefined
  onMoveTargetChange?: ((workspace: string) => void) | undefined
  /** Called with the picked action, such as `rename`; the sheet then closes. */
  onSelect?: ((action: PaneAction['value']) => void) | undefined
  /** The icons' Figma layers, by action value, workspace id or `new`. */
  layers?: Record<string, string> | undefined
}

export function PhoneChatActions(props: PhoneChatActionsProps) {
  const { title, actions, targets, newWorkspace, trigger, open, onOpenChange, moveOpen, layers } = props
  const row = (a: PaneAction): OptionListItem => ({
    value: a.value,
    label: a.label,
    leading: (
      <Icon layer={layers?.[a.value]} tone={toneOf[a.value]}>
        {icons[a.value]}
      </Icon>
    ),
    trailing:
      a.value === 'subagents' ? (
        <ChevronRightIcon size="16" />
      ) : a.value === 'move' ? (
        <ChevronDownIcon size="16" />
      ) : undefined,
  })
  const split = actions.findIndex((a) => a.value === 'move') + 1
  const before = split === 0 ? actions : actions.slice(0, split)
  const after = split === 0 ? [] : actions.slice(split)
  const pick = (value: string) => {
    const action = actions.find((a) => a.value === value)
    if (action === undefined) return
    if (action.value === 'move') {
      props.onMoveOpenChange?.(!moveOpen)
      return
    }
    props.onSelect?.(action.value)
    onOpenChange?.(false)
  }
  const workspaces: OptionListItem[] = [
    ...targets.map((w) => ({
      value: w.id,
      label: w.label,
      leading: (
        <Icon layer={layers?.[w.id]} tone={w.id === props.moveTarget ? 'accent' : 'muted'}>
          <GridIcon size="16" />
        </Icon>
      ),
    })),
    {
      value: 'new',
      label: newWorkspace,
      leading: (
        <Icon layer={layers?.new} tone="muted">
          <PlusIcon size="16" />
        </Icon>
      ),
    },
  ]
  const moveLabel = actions.find((a) => a.value === 'move')?.label ?? newWorkspace
  return (
    <BottomSheet size="sm" title={title} trigger={trigger} open={open} onOpenChange={onOpenChange}>
      <OptionList
        label={title}
        items={before.map(row)}
        value={moveOpen ? 'move' : null}
        selectedFill
        check={false}
        onItemSelect={pick}
      />
      {moveOpen ? (
        <div className={nested}>
          <OptionList
            label={moveLabel}
            size="sm"
            items={workspaces}
            value={props.moveTarget ?? null}
            onItemSelect={(value) => {
              props.onMoveTargetChange?.(value)
            }}
          />
        </div>
      ) : null}
      {after.length === 0 ? null : (
        <OptionList label={title} items={after.map(row)} value={null} check={false} onItemSelect={pick} />
      )}
    </BottomSheet>
  )
}
