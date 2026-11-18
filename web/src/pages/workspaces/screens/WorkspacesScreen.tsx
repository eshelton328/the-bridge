// The Workspaces page (Figma Workbench) as one props-only screen: the rail,
// then the Workbench: the workspace tabs with the sidebar toggle and New
// chat, the current workspace's split panes and the status bar (D1). A
// state file's data and ui are its props. What Erik opens or closes
// (a pane menu, the skill list, the focused pane) the screen keeps until
// the state changes; `onUiChange` reports it. With the sidebar (D2) the
// workspaces and their chats are listed beside the focused chat, which shows
// alone, with its side chat beside it; its actions sit behind the ⋯ of its
// header (D2b). In place of the side chat the subagents panel can show,
// and the New chat form can open over the screen (D3). The folders control
// sits under the prompt box with its list open, and the folder picker takes
// the side slot (D4). With the split panes, a side chat opens inside its
// pane (D5). A chat dragged from the sidebar onto the chat shown alone
// fades in the sidebar, and the drop zone shows where it would open (D6).
// A chat opened from the sidebar can show in the workbench beside it, in
// place of the chat alone (D7), and a chat dragged over one of its panes
// shows the drop zone over that pane (D8). A chat action's dialog, such as
// Fork (D15) or Subtask (D17), opens over the screen for the chat shown
// alone.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppRail } from '../../../blocks/AppRail.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { css } from '../../../../styled-system/css/index.js'
import { MainChat } from '../blocks/MainChat.tsx'
import { NewChatDialog } from '../blocks/NewChatDialog.tsx'
import { SubagentsPane } from '../blocks/SubagentsPane.tsx'
import { SubtaskDialog } from '../blocks/SubtaskDialog.tsx'
import { ChatActionsMenu } from '../blocks/ChatActionsMenu.tsx'
import { ForkDialog } from '../blocks/ForkDialog.tsx'
import { FolderPickerPane } from '../blocks/FolderPickerPane.tsx'
import { FoldersControl } from '../blocks/FoldersControl.tsx'
import { PaneDropZone } from '../blocks/PaneDropZone.tsx'
import { SideChatPanel } from '../blocks/SideChatPanel.tsx'
import { WorkspaceSidebar } from '../blocks/WorkspaceSidebar.tsx'
import { WorkspaceTabs } from '../blocks/WorkspaceTabs.tsx'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'

// The rail's slot is a flex column; the rail fills it.
const railSlot = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type WorkspacesScreenProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
}

export function WorkspacesScreen({ data, ui: stateUi, viewport, onNavigate, onUiChange }: WorkspacesScreenProps) {
  const [changed, setChanged] = useState<{ of: WorkspacesUi; ui: WorkspacesUi }>({ of: stateUi, ui: stateUi })
  const ui = changed.of === stateUi ? changed.ui : stateUi
  const change = (next: Partial<WorkspacesUi>) => {
    setChanged({ of: stateUi, ui: { ...ui, ...next } })
    onUiChange?.(next)
  }
  const current = data.workspaces.find((w) => w.id === data.current)
  const rail = (
    <div data-figma="nav rail" className={railSlot}>
      <AppRail selected="workspaces" inboxBadge={data.railBadge} onSelect={onNavigate} />
    </div>
  )
  // The focused pane when it is a chat: only a chat can show alone. Beside the workbench any pane can be focused.
  const focused = data.panes.find((p) => p.id === ui.focusedPane)
  const chat = focused?.type === 'chat' ? focused : undefined
  if (ui.sidebar === true && data.sidebar !== undefined && (ui.workbench === true || chat !== undefined)) {
    const menuOpen = ui.menuFor === chat?.id
    const chatMenu =
      data.chatMenu === undefined || chat === undefined ? undefined : (
        <ChatActionsMenu
          title={chat.head.title}
          actions={data.chatMenu}
          targets={data.workspaces.filter((w) => w.id !== data.current)}
          newWorkspace={data.newWorkspace}
          open={menuOpen}
          onOpenChange={(open) => {
            change({ menuFor: open ? chat.id : null, moveOpen: false })
          }}
          moveOpen={menuOpen && ui.moveOpen}
          onMoveOpenChange={(open) => {
            change({ moveOpen: open })
          }}
          highlighted={ui.menuHighlight}
          onHighlightChange={(menuHighlight) => {
            change({ menuHighlight })
          }}
          moveTarget={ui.moveTarget}
          onMoveTargetChange={(moveTarget) => {
            change({ moveTarget })
          }}
          figma={{ trigger: data.layers?.chatActions, menu: data.layers?.chatMenu }}
        />
      )
    const subagents =
      ui.subagentsOpen === true && data.subagents !== undefined ? (
        <SubagentsPane
          panel={data.subagents}
          open={ui.transcripts ?? []}
          onOpenChange={(transcripts) => {
            change({ transcripts })
          }}
          onClose={() => {
            change({ subagentsOpen: false })
          }}
          figma={{ panel: data.layers?.subagents, cards: data.layers?.subagentCards }}
        />
      ) : undefined
    const folderPicker =
      ui.folderPickerOpen === true && data.folderPicker !== undefined ? (
        <FolderPickerPane
          picker={data.folderPicker}
          picked={ui.pickedFolder ?? null}
          onPick={(pickedFolder) => {
            change({ pickedFolder })
          }}
          onClose={() => {
            change({ folderPickerOpen: false })
          }}
        />
      ) : undefined
    const sideChat =
      ui.sideChatOpen === true && data.sideChat !== undefined ? (
        <SideChatPanel
          chat={data.sideChat}
          layers={data.layers}
          onClose={() => {
            change({ sideChatOpen: false })
          }}
        />
      ) : undefined
    const dragged = data.workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === ui.paneDrag?.chat)
    const dropZone =
      ui.paneDrag == null || data.paneDrop === undefined || dragged === undefined || chat === undefined ? undefined : (
        <PaneDropZone
          edge={ui.paneDrag.edge}
          chat={dragged}
          target={chat.head.title}
          drop={data.paneDrop}
          figma={data.layers?.dropZone}
        />
      )
    return (
      <Backdrop size={viewport}>
        <AppShell
          size="desktop"
          listWidth="sidebar"
          rail={rail}
          list={
            <WorkspaceSidebar
              text={data.sidebar}
              workspaces={data.workspaces}
              selected={ui.focusedPane}
              openable={data.panes.flatMap((p) => (p.type === 'chat' ? [p.id] : []))}
              ui={ui}
              onUiChange={change}
              layers={data.layers}
            />
          }
          detail={
            ui.workbench === true || chat === undefined ? (
              <WorkspaceTabs data={data} ui={ui} onUiChange={change} toggle={false} />
            ) : (
              <MainChat
                pane={chat}
                workspace={current?.label ?? data.current}
                contextLabel={data.sidebar.contextLabel}
                skills={{
                  label: data.skillsLabel,
                  items: data.skills,
                  value: ui.skill,
                  open: ui.skillsFor === chat.id,
                }}
                onSkillsOpenChange={(open) => {
                  change({ skillsFor: open ? chat.id : null })
                }}
                menu={data.chatActions === false ? null : chatMenu}
                folders={
                  data.folders === undefined ? undefined : (
                    <FoldersControl
                      folders={data.folders}
                      open={ui.foldersOpen === true}
                      onOpenChange={(foldersOpen) => {
                        change({ foldersOpen })
                      }}
                      onAdd={() => {
                        change({ foldersOpen: false, folderPickerOpen: true })
                      }}
                    />
                  )
                }
                layers={data.layers}
                overlay={dropZone}
              />
            )
          }
          sideWidth={subagents === undefined ? 'side' : 'wide'}
          side={subagents ?? folderPicker ?? sideChat}
        />
        {data.newChat === undefined ? null : (
          <NewChatDialog
            form={data.newChat}
            workspaces={data.workspaces}
            open={ui.newChatOpen === true}
            onOpenChange={(open) => {
              change({ newChatOpen: open })
            }}
          />
        )}
        {data.fork === undefined || chat === undefined ? null : (
          <ForkDialog
            form={data.fork}
            chat={chat.head.title}
            open={ui.chatDialog === 'fork'}
            onOpenChange={(open) => {
              change({ chatDialog: open ? 'fork' : null })
            }}
          />
        )}
        {data.subtask === undefined || chat === undefined ? null : (
          <SubtaskDialog
            form={data.subtask}
            open={ui.chatDialog === 'subtask'}
            onOpenChange={(open) => {
              change({ chatDialog: open ? 'subtask' : null })
            }}
          />
        )}
      </Backdrop>
    )
  }
  return (
    <Backdrop size={viewport}>
      <AppShell size="desktop" rail={rail} detail={<WorkspaceTabs data={data} ui={ui} onUiChange={change} toggle />} />
    </Backdrop>
  )
}
