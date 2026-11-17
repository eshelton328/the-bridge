// One workspace in the sidebar (D2 105:623): its header, with the drag
// handle (D3 and D4 have none), the chevron that shows or hides its chats,
// the name, the count and the needs-you dot, then its chats. The header
// shows rename and close while the pointer rests on it, and the workspace
// menu otherwise. While a chat is dragged over it, its header is the drop
// target and the chat follows the pointer with a hint under it (105:960,
// 105:976). The library has no drop target or drag preview
// (LIBRARY_GAPS.md). Props only.
import {
  Badge,
  Button,
  CloseIcon,
  EditIcon,
  GripIcon,
  GroupHeader,
  MoreIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarChat, SidebarLayers, Workspace } from '../types.ts'
import { SidebarChatRow } from './SidebarChatRow.tsx'

// D2's Figma layers of the headers by workspace, and of the rows by chat; a state's `layers` replaces them.
const headerLayers: Record<string, string> = {
  'omni-brain': '105:623',
  'the-bridge': '105:687',
  omni: '105:730',
  'skill-evals': '105:767',
}
const rowLayers: Record<string, string> = {
  'bridge-themes': '105:643',
  'theme-tokens': '199:51',
  'drift-check': '105:660',
  'brain-git': '105:676',
  'hono-server': '105:705',
  'dev-server': '105:719',
  'release-notes': '105:751',
}

const group = css({ position: 'relative' })
// Figma's header is 28 high with 14 px icons (105:623); the library's smallest icon button is 24 (control.xs),
// so the buttons reach 4 into the header's padding above and below instead of making the header taller.
const headerActions = css({ display: 'inline-flex', alignItems: 'center', gap: '4', my: '-4' })
// A text button draws its icon in the accent colour; Figma draws the header's ⋯, rename and close in the header's
// grey (fg.muted, D2 105:743 and 105:746).
const headerAction = css({ color: 'fg.muted' })
// The drop target (105:687): a dashed cyan outline on the selected fill, as Figma draws it.
const dropTarget = css({
  borderRadius: 'md',
  borderWidth: 'default',
  borderStyle: 'dashed',
  borderColor: 'border.selected',
  bg: 'surface.selected',
})
// The dragged chat (105:960) floats over the group's rows where the pointer holds it, with the hint (105:976)
// under it. Figma puts the chat 40 in from the rows and the hint 20 in; the sidebar's body clips what passes its
// edge, so the chat ends at the rows' end (d-100: the offsets are the nearest spacing tokens).
const overlay = css({
  position: 'absolute',
  top: '40',
  insetInlineStart: '20',
  insetInlineEnd: '0',
  zIndex: '1',
  display: 'flex',
  flexDirection: 'column',
  gap: '12',
})
// The row and the pill have tinted fills; Figma draws them over the rows under them, so each sits on the
// opaque overlay surface.
const preview = css({ ms: '20', bg: 'surface.overlay', borderRadius: 'lg' })
const hint = css({ alignSelf: 'flex-start', bg: 'surface.overlay', borderRadius: 'full' })

export type SidebarGroupProps = {
  workspace: Workspace
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The pointer rests on the header. */
  hovered: boolean
  /** The chat in the middle of the screen. */
  selected: string
  /** The chats with a pane to show; the other rows cannot be selected. */
  openable: readonly string[]
  onSelect?: ((chat: string) => void) | undefined
  /** The chat dragged over this workspace, and the hint under it. */
  drop?: { chat: SidebarChat; hint: string } | undefined
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
  /** `false`: the header shows no count and no needs-you dot (D4). */
  counts?: boolean | undefined
  /** `false`: the header has no drag handle before the chevron (D3, D4). */
  grip?: boolean | undefined
  /** The chat dragged onto the chat shown alone: its row fades (D6). */
  moving?: string | undefined
}

export function SidebarGroup(props: SidebarGroupProps) {
  const {
    workspace,
    open,
    onOpenChange,
    hovered,
    selected,
    openable,
    onSelect,
    drop,
    layers,
    counts = true,
    grip = true,
    moving,
  } = props
  const rowsId = useId()
  const name = workspace.label
  return (
    <div className={group}>
      <div
        data-figma={(layers?.headers ?? headerLayers)[workspace.id]}
        className={drop === undefined ? undefined : dropTarget}
      >
        <GroupHeader
          variant="sidebar"
          label={name}
          count={counts ? workspace.count : undefined}
          dot={counts && workspace.needsYou ? 'needsYou' : undefined}
          open={open}
          onOpenChange={onOpenChange}
          contentId={rowsId}
          leading={grip ? <GripIcon size="12" /> : undefined}
          actions={
            <span className={headerActions}>
              {hovered ? (
                <>
                  <Button variant="text" size="xs" iconOnly className={headerAction} aria-label={`Rename ${name}`}>
                    <EditIcon size="12" />
                  </Button>
                  <Button variant="text" size="xs" iconOnly className={headerAction} aria-label={`Close ${name}`}>
                    <CloseIcon size="12" />
                  </Button>
                </>
              ) : (
                <Button variant="text" size="xs" iconOnly className={headerAction} aria-label={`${name} actions`}>
                  <MoreIcon size="12" />
                </Button>
              )}
            </span>
          }
        />
      </div>
      {open ? (
        <Stack id={rowsId} gap="4">
          {(workspace.chats ?? []).map((chat) => (
            <SidebarChatRow
              key={chat.id}
              chat={chat}
              figma={(layers?.rows ?? rowLayers)[chat.id]}
              selected={chat.id === selected}
              moving={chat.id === moving}
              onSelect={openable.includes(chat.id) ? () => onSelect?.(chat.id) : undefined}
            />
          ))}
        </Stack>
      ) : null}
      {drop === undefined ? null : (
        <div className={overlay}>
          <div className={preview} aria-hidden="true">
            <SidebarChatRow chat={drop.chat} figma="105:960" dragged />
          </div>
          <div className={hint} data-figma="105:976" role="status">
            <Badge label={drop.hint} tone="working" />
          </div>
        </div>
      )}
    </div>
  )
}
