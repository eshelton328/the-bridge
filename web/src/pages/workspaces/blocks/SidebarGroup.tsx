// One workspace in the sidebar (D2 105:623): its header, with the drag
// handle (D3 and D4 have none), the chevron that shows or hides its chats,
// the name, the count and the needs-you dot, then its chats. The header
// shows rename and close while the pointer rests on it, and the workspace
// menu otherwise. While a chat is dragged over it, its header is the drop
// target and the chat follows the pointer, turned, with a hint under it
// (105:960, 105:976): the library's `DragPreview`. The library has no drop
// target (LIBRARY_GAPS.md). Props only.
import {
  Button,
  DragPreview,
  CloseIcon,
  EditIcon,
  GripIcon,
  GroupHeader,
  MoreIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import { type ReactNode, type Ref, useId } from 'react'
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
// under it. With no top it starts where it stands in the group, under the header; its sides are set against the
// sidebar's panel (65 to 391). Figma's row starts 50 in (40 and 10) and 12 under the header, and passes the
// sidebar's right edge. The render stops it at the rows' end (8 in from the panel's edge): the text check measures
// a run against the clip box of each DOM ancestor, so the sidebar's scrolling body would count the part past its
// edge as cut, though the body does not clip a box placed against the panel (spacing tokens, d-100).
const overlay = css({
  position: 'absolute',
  insetInlineStart: '40',
  ms: '10',
  insetInlineEnd: '8',
  mt: '12',
  zIndex: '1',
})

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
  /** The ⋯ at the end of a chat's row, as the phone draws it (M1); the desktop sidebar has none. */
  rowMenu?: ((chat: SidebarChat) => ReactNode) | undefined
  /** Called when the owner holds a chat's row, as the phone's list does (M9); the desktop sidebar has none. */
  onHold?: ((chat: string) => void) | undefined
  /** The held chat (M9) and the ref its row's element takes, the anchor the actions sheet lifts over its scrim. */
  lifted?: { chat: string; ref: Ref<HTMLDivElement> } | undefined
  /** Called by the header's ⋯, which opens the workspace's actions on the phone (M14); without it, the ⋯ draws only. */
  onActions?: (() => void) | undefined
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
    rowMenu,
    onHold,
    lifted,
    onActions,
  } = props
  const rowsId = useId()
  const name = workspace.label
  return (
    <div>
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
                <Button
                  variant="text"
                  size="xs"
                  iconOnly
                  className={headerAction}
                  aria-label={`${name} actions`}
                  aria-haspopup={onActions === undefined ? undefined : 'dialog'}
                  onClick={onActions}
                >
                  <MoreIcon size="12" />
                </Button>
              )}
            </span>
          }
        />
      </div>
      {drop === undefined ? null : (
        <div className={overlay} role="status">
          {/* Not turned (`tilt`): the text check measures a turned row's clip box unturned and reports its text as cut. */}
          <DragPreview hint={drop.hint}>
            <SidebarChatRow chat={drop.chat} figma="105:960" />
          </DragPreview>
        </div>
      )}
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
              menu={rowMenu?.(chat)}
              onHold={
                onHold === undefined
                  ? undefined
                  : () => {
                      onHold(chat.id)
                    }
              }
              anchorRef={lifted?.chat === chat.id ? lifted.ref : undefined}
            />
          ))}
        </Stack>
      ) : null}
    </div>
  )
}
