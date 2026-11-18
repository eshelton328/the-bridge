// One workspace in the phone's list in edit mode (M2 105:2516): the header
// with its drag handle and × to close the workspace, then its chats, each
// with its handle and no ⋯. A tap on a chat's name opens its name as a field
// (PhoneRenameRow); a workspace in `renaming` shows its name as a field in
// place of the name, the count and × (105:2614). × asks before the workspace
// closes (M13, `onClose`). A chat in `moveTo` shows Move to… in place of
// its status (T1 105:1594). Props only.
import {
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  GripIcon,
  GroupHeader,
  Inline,
  Stack,
} from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, Workspace } from '../types.ts'
import { ChatNameField } from './ChatNameField.tsx'
import { MoveButton } from './MoveButton.tsx'
import { PhoneRenameRow } from './PhoneRenameRow.tsx'
import { SidebarChatRow } from './SidebarChatRow.tsx'

// As SidebarGroup draws the header's buttons: 24 high in the 28 px header, in the header's grey (M2 105:2530). Figma's
// × ends at the header's end padding (105:2530, 357 to 372); the 24 px button reaches 4 into that padding, so its icon
// is centred where Figma's is.
const headerAction = css({ color: 'fg.muted', my: '-4', me: '-4' })
// M2 105:2604: the handle 4 in (105:2605), the chevron 8 after it (105:2612) and the field to 6 from the end
// (105:2614). The field is 28 high (control.sm) where Figma's is 25, so the header pads 6, not 8, above and below.
const renameHeader = css({ ps: '4', pe: '6', py: '6' })
// T1 105:1622: on the tablet the field ends 6 from the header's end (105:1632) where the Container pads 2 more than
// Figma's 22, so the header pads 4 at its end.
const tabletRenameHeader = css({ ps: '4', pe: '4', py: '6' })
const grip = css({ color: 'fg.subtle', flexShrink: '0' })
// The chevron's 24 px button reaches 6 into the gaps on each side, so the icon sits where Figma draws it.
const chevron = css({ color: 'fg.muted', mx: '-6' })

export type PhoneEditGroupProps = {
  /** The phone, or a tablet in a state with `tabletList` (T1): the field's end inset follows it. */
  device?: 'phone' | 'tablet' | undefined
  workspace: Workspace
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The text in the workspace's name field, while it is one. */
  renaming?: string | undefined
  /** The chats whose name is a field, by id, with the text in the field. */
  renamingChats: Readonly<Record<string, string>>
  /** The chat or workspace whose field takes the focus as it opens. */
  focus?: string | undefined
  /** Opens a chat's name as a field. */
  onRenameChat?: ((chat: string) => void) | undefined
  /** Called with a chat's id and its new name, or with no name when Erik undoes the change. */
  onChatRenamed?: ((chat: string, name?: string) => void) | undefined
  /** Called with the workspace's new name, or with none when Erik undoes the change. */
  onRenamed?: ((name?: string) => void) | undefined
  /** × was pressed: ask before the workspace closes (M13). Without it, × draws only. */
  onClose?: (() => void) | undefined
  /** Move to… in place of the status of the chats it lists (T1 105:1594). */
  moveTo?: { label: string; chats: readonly string[] } | undefined
  /** Move to… on a chat was pressed. Without it, the button draws only. */
  onMove?: ((chat: string) => void) | undefined
  layers?: SidebarLayers | undefined
}

export function PhoneEditGroup(props: PhoneEditGroupProps) {
  const {
    device = 'phone',
    workspace,
    open,
    onOpenChange,
    renaming,
    renamingChats,
    focus,
    onRenameChat,
    onChatRenamed,
    onRenamed,
    onClose,
    moveTo,
    onMove,
  } = props
  const { layers } = props
  const rowsId = useId()
  const name = workspace.label
  const toggle = () => onOpenChange?.(!open)
  return (
    <div>
      {renaming === undefined ? (
        <div data-figma={layers?.headers?.[workspace.id]}>
          <GroupHeader
            variant="sidebar"
            label={name}
            count={workspace.count}
            dot={workspace.needsYou ? 'needsYou' : undefined}
            open={open}
            onOpenChange={onOpenChange}
            contentId={rowsId}
            leading={<GripIcon size="12" />}
            actions={
              <Button
                variant="text"
                size="xs"
                iconOnly
                className={headerAction}
                aria-label={`Close ${name}`}
                onClick={onClose}
              >
                <CloseIcon size="12" />
              </Button>
            }
          />
        </div>
      ) : (
        <Inline
          gap="8"
          align="center"
          className={device === 'tablet' ? tabletRenameHeader : renameHeader}
          data-figma={layers?.headers?.[workspace.id]}
        >
          <span className={grip}>
            <GripIcon size="12" />
          </span>
          <Button
            variant="text"
            size="xs"
            iconOnly
            className={chevron}
            // A disclosure toggle: it keeps its bare look while the chats show, as Figma draws it (105:2612).
            expandedBorder="default"
            aria-label={open ? `Hide the chats of ${name}` : `Show the chats of ${name}`}
            aria-expanded={open}
            aria-controls={rowsId}
            onClick={toggle}
          >
            {open ? <ChevronDownIcon size="12" /> : <ChevronRightIcon size="12" />}
          </Button>
          <ChatNameField
            name={name}
            draft={renaming}
            autoFocus={focus === workspace.id}
            fill
            onSave={(next) => onRenamed?.(next)}
            onCancel={() => onRenamed?.()}
            figma={layers?.renameFields?.[workspace.id]}
          />
        </Inline>
      )}
      {open ? (
        <Stack id={rowsId} gap="4">
          {(workspace.chats ?? []).map((chat) => {
            const draft = renamingChats[chat.id]
            return draft === undefined ? (
              <SidebarChatRow
                key={chat.id}
                chat={chat}
                figma={layers?.rows?.[chat.id]}
                grip
                onSelect={() => onRenameChat?.(chat.id)}
                menu={
                  moveTo?.chats.includes(chat.id) === true ? (
                    <MoveButton
                      label={moveTo.label}
                      onMove={
                        onMove === undefined
                          ? undefined
                          : () => {
                              onMove(chat.id)
                            }
                      }
                      figma={layers?.rowMoves?.[chat.id]}
                    />
                  ) : undefined
                }
              />
            ) : (
              <PhoneRenameRow
                key={chat.id}
                chat={chat}
                draft={draft}
                autoFocus={focus === chat.id}
                onSave={(next) => onChatRenamed?.(chat.id, next)}
                onCancel={() => onChatRenamed?.(chat.id)}
                figma={layers?.rows?.[chat.id]}
                fieldFigma={layers?.renameFields?.[chat.id]}
              />
            )
          })}
        </Stack>
      ) : null}
    </div>
  )
}
