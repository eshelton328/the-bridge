// The phone's home of the Workspaces page (M1 105:2327): the large title
// with Edit and +, then every workspace with its chats, as the desktop
// sidebar lists them (SidebarGroup), each chat row with its ⋯ after the
// status. A tap on a row with a chat to show selects it and opens it (M3); a workspace's
// chevron shows or hides its chats. Edit (with `text.done`) starts edit
// mode (M2): each workspace is a PhoneEditGroup, + is off and Done ends it.
// With `text.rowMenu`, holding a row or tapping its ⋯ opens the chat's
// actions (M9, `ui.menuFor`, the sheet in WorkspacesPhone) with the first
// action highlighted, and the held row lifts over the sheet's scrim.
// With `text.closeWorkspace`, × on a workspace in edit mode asks before it
// closes (M13, `ui.closing`); Close adds it to `ui.closedWorkspaces`, which
// WorkspacesScreen takes out of `workspaces` in both layouts.
// With `text.workspaceMenu`, the ⋯ of a workspace's header opens its actions
// (M14, `ui.workspaceMenuFor`, the sheet in WorkspacesPhone). With
// `text.addMenu`, + opens New chat and New workspace (M15, `ui.addMenuOpen`,
// PhoneAddMenu). With `text.moveTo`, edit mode draws Move to… in place of
// the status of its chats (T1 105:1594), which opens the chat's actions with
// Move to workspace's list open. At a tablet's width (T1, `device`) the list
// takes the tablet's inset. Props only.
import { Button, Container, MoreIcon, PageHeader } from '@eshelton328/component-library-1701'
import type { MouseEvent, Ref } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { PhoneText, SidebarChat, SidebarLayers, Workspace, WorkspacesUi } from '../types.ts'
import { CloseWorkspaceDialog } from './CloseWorkspaceDialog.tsx'
import { PhoneAddMenu } from './PhoneAddMenu.tsx'
import { PhoneEditGroup } from './PhoneEditGroup.tsx'
import { SidebarGroup } from './SidebarGroup.tsx'

// The list fills the screen, running under the tab bar that lies over its foot (M1 105:2327, 38 to 767).
const fill = css({ flex: '1' })
// M1 105:2329: the large title sits 4 in from the header's edge, over the group chevrons, and Edit and + end 4 in.
// Figma's header is 44 high (105:2328) where `PageHeader size="phone"` is 40, so it pads 4 under the title.
const header = css({ px: '4', pb: '4' })
// T1 105:1518: on the tablet + ends 4 in from the header (105:1525) where the Container pads 2 more than Figma's 22,
// so the header pads 2 at its end; Done (105:1523) sits 6 before +.
const tabletHeader = css({ ps: '4', pe: '2', pb: '4' })
// A text button draws its icon in the accent colour; Figma draws the row's ⋯ in grey (M1 146:3). Figma's ⋯ ends 2 in
// from the row's edge, where `ListRow` pads 10 inside its border, so the button reaches 8 into that padding and the
// status moves with it. The button is 36 high in a 52 px row, as in Figma (146:2), so it reaches 4 into the padding
// above and below too, and the row keeps the height of its two lines (LIBRARY_GAPS.md: Phone chat row).
const rowMenu = css({ color: 'fg.muted', me: '-8', my: '-4' })

/** The record without the entry of `id`. */
const without = (record: Readonly<Record<string, string>>, id: string) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== id))

export type PhoneWorkspaceListProps = {
  /** The phone, or a tablet in a state with `tabletList` (T1 105:1517): the Container's inset follows it. */
  device?: 'phone' | 'tablet' | undefined
  text: PhoneText
  workspaces: readonly Workspace[]
  /** The chat drawn selected: the one shown last. */
  selected: string
  /** The chats with a pane to show; the other rows cannot be selected. */
  openable: readonly string[]
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** A pick in the menu that + opens (M15); WorkspacesPhone opens New chat or adds the workspace. */
  onAdd?: ((action: 'newChat' | 'newWorkspace') => void) | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
  /** The ref the held chat's row takes (M9): the anchor that WorkspacesPhone's actions sheet lifts over its scrim. */
  heldRow?: Ref<HTMLDivElement> | undefined
}

/** A chat row's ⋯ (M1 146:3), on the row and on its lifted copy (M9 146:268). */
export function RowMenuButton({
  chat,
  layer,
  onClick,
}: {
  chat: SidebarChat
  layer: string | undefined
  onClick?: ((event: MouseEvent) => void) | undefined
}) {
  return (
    <Button
      variant="text"
      size="lg"
      iconOnly
      className={rowMenu}
      aria-label={`${chat.title} actions`}
      data-figma={layer}
      onClick={onClick}
    >
      <MoreIcon size="20" />
    </Button>
  )
}

export function PhoneWorkspaceList({
  device = 'phone',
  text,
  workspaces,
  selected,
  openable,
  ui,
  onUiChange,
  onAdd,
  layers,
  heldRow,
}: PhoneWorkspaceListProps) {
  const collapsed = ui.collapsed ?? []
  const editing = ui.editing === true && text.done !== undefined
  const renamingChats = ui.renamingChats ?? {}
  const renamingWorkspaces = ui.renamingWorkspaces ?? {}
  // One field takes the focus as it opens: the first chat's, else the first workspace's; a second field that took
  // it would blur the first, which saves and closes it.
  const focus = Object.keys(renamingChats)[0] ?? Object.keys(renamingWorkspaces)[0]
  // M9: the row's actions open on a hold or on its ⋯, the first one highlighted.
  const openActions =
    text.rowMenu === undefined
      ? undefined
      : (chat: string) =>
          onUiChange?.({ menuFor: chat, moveOpen: false, menuHighlight: text.rowMenu?.[0]?.value ?? null })
  const held = workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === ui.menuFor)
  const more = (chat: SidebarChat, layer: string | undefined) => (
    <RowMenuButton
      chat={chat}
      layer={layer}
      onClick={
        openActions === undefined
          ? undefined
          : (event) => {
              // The ⋯ opens the actions, not the chat under it.
              event.stopPropagation()
              openActions(chat.id)
            }
      }
    />
  )
  const closed = ui.closedWorkspaces ?? []
  const closeText = text.closeWorkspace
  const setOpen = (id: string, open: boolean) =>
    onUiChange?.({ collapsed: open ? collapsed.filter((c) => c !== id) : [...collapsed, id] })
  return (
    <Container size={device} gap="4" className={fill} data-figma={layers?.phoneList}>
      <div className={device === 'tablet' ? tabletHeader : header} data-figma={layers?.phoneHeader}>
        <PageHeader size="phone" title={text.title}>
          {editing ? (
            // M2 105:2508: Done ends edit mode and closes the fields; a field with the focus saves as it blurs.
            <Button
              variant="primary"
              size="sm"
              data-figma={layers?.phoneEdit}
              onClick={() => onUiChange?.({ editing: false, renamingChats: {}, renamingWorkspaces: {} })}
            >
              {text.done}
            </Button>
          ) : (
            <Button
              size="sm"
              data-figma={layers?.phoneEdit}
              onClick={text.done === undefined ? undefined : () => onUiChange?.({ editing: true })}
            >
              {text.edit}
            </Button>
          )}
          {/* M2 105:2510: + is off in edit mode. M15: with `text.addMenu` it opens New chat and New workspace. */}
          <PhoneAddMenu
            label={text.add}
            text={text.addMenu}
            disabled={editing}
            open={ui.addMenuOpen === true}
            onOpenChange={(addMenuOpen) => onUiChange?.({ addMenuOpen })}
            onSelect={onAdd}
            figma={{ trigger: layers?.phoneAdd, menu: layers?.addMenu?.menu, icons: layers?.addMenu?.icons }}
          />
        </PageHeader>
      </div>
      {workspaces.map((w) =>
        editing ? (
          <PhoneEditGroup
            key={w.id}
            device={device}
            workspace={w}
            open={!collapsed.includes(w.id)}
            onOpenChange={(open) => setOpen(w.id, open)}
            renaming={renamingWorkspaces[w.id]}
            renamingChats={renamingChats}
            focus={focus}
            onRenameChat={(chat) => {
              const title = w.chats?.find((c) => c.id === chat)?.title ?? ''
              onUiChange?.({ renamingChats: { ...renamingChats, [chat]: title } })
            }}
            onChatRenamed={(chat, name) =>
              onUiChange?.({
                renamingChats: without(renamingChats, chat),
                ...(name === undefined ? {} : { names: { ...ui.names, [chat]: name } }),
              })
            }
            onRenamed={(name) =>
              onUiChange?.({
                renamingWorkspaces: without(renamingWorkspaces, w.id),
                ...(name === undefined ? {} : { workspaceNames: { ...ui.workspaceNames, [w.id]: name } }),
              })
            }
            onClose={closeText?.workspaces[w.id] === undefined ? undefined : () => onUiChange?.({ closing: w.id })}
            moveTo={text.moveTo}
            onMove={
              text.rowMenu === undefined
                ? undefined
                : (chat) => onUiChange?.({ menuFor: chat, moveOpen: true, menuHighlight: null })
            }
            layers={layers}
          />
        ) : (
          <SidebarGroup
            key={w.id}
            workspace={w}
            open={!collapsed.includes(w.id)}
            onOpenChange={(open) => setOpen(w.id, open)}
            hovered={false}
            selected={selected}
            openable={openable}
            layers={layers}
            grip={false}
            onSelect={(chat) => onUiChange?.({ focusedPane: chat, phoneView: 'chat' })}
            rowMenu={(chat) => more(chat, layers?.rowMenus?.[chat.id])}
            onHold={openActions}
            onActions={text.workspaceMenu === undefined ? undefined : () => onUiChange?.({ workspaceMenuFor: w.id })}
            lifted={
              openActions === undefined || held === undefined || heldRow === undefined
                ? undefined
                : { chat: held.id, ref: heldRow }
            }
          />
        ),
      )}
      {closeText === undefined ? null : (
        <CloseWorkspaceDialog
          text={closeText}
          workspace={workspaces.find((w) => w.id === ui.closing) ?? null}
          onOpenChange={(open) => {
            if (!open) onUiChange?.({ closing: null })
          }}
          onConfirm={(id) => onUiChange?.({ closing: null, closedWorkspaces: [...closed, id] })}
          layers={layers?.closeDialog}
        />
      )}
    </Container>
  )
}
