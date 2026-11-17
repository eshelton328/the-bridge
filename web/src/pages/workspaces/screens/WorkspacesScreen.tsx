// The Workspaces page (Figma Workbench) as one props-only screen: the rail,
// then the Workbench: the workspace tabs with the sidebar toggle and New
// chat, the current workspace's split panes and the status bar (D1). A
// state file's data and ui are its props. What Erik opens or closes
// (a pane menu, the skill list, the focused pane) the screen keeps until
// the state changes; `onUiChange` reports it. With the sidebar (D2) the
// workspaces and their chats are listed beside the focused chat, which shows
// alone, with its side chat beside it; its actions sit behind the ⋯ of its
// header (D2b).
import { AppShell, Backdrop, Button, PanelIcon, PlusIcon, Workbench } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppRail } from '../../../blocks/AppRail.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { css } from '../../../../styled-system/css/index.js'
import { MainChat } from '../blocks/MainChat.tsx'
import { ChatActionsMenu } from '../blocks/ChatActionsMenu.tsx'
import { SideChatPanel } from '../blocks/SideChatPanel.tsx'
import { WorkbenchPanes } from '../blocks/WorkbenchPanes.tsx'
import { WorkspaceSidebar } from '../blocks/WorkspaceSidebar.tsx'
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
  const chat = data.panes.find((p) => p.id === ui.focusedPane)
  if (ui.sidebar === true && data.sidebar !== undefined && chat?.type === 'chat') {
    const menuOpen = ui.menuFor === chat.id
    const chatMenu =
      data.chatMenu === undefined ? undefined : (
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
          figma={{ trigger: data.layers?.chatActions, menu: data.layers?.chatMenu }}
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
              selected={chat.id}
              ui={ui}
              onUiChange={change}
              layers={data.layers}
            />
          }
          detail={
            <MainChat
              pane={chat}
              workspace={current?.label ?? data.current}
              contextLabel={data.sidebar.contextLabel}
              skills={{ label: data.skillsLabel, items: data.skills, value: ui.skill, open: ui.skillsFor === chat.id }}
              onSkillsOpenChange={(open) => {
                change({ skillsFor: open ? chat.id : null })
              }}
              menu={chatMenu}
              layers={data.layers}
            />
          }
          side={
            ui.sideChatOpen === true && data.sideChat !== undefined ? (
              <SideChatPanel
                chat={data.sideChat}
                layers={data.layers}
                onClose={() => {
                  change({ sideChatOpen: false })
                }}
              />
            ) : undefined
          }
        />
      </Backdrop>
    )
  }
  return (
    <Backdrop size={viewport}>
      <AppShell
        size="desktop"
        rail={rail}
        detail={
          <Workbench
            value={data.current}
            workspaces={data.workspaces.map((w) => ({
              value: w.id,
              label: w.label,
              count: w.count,
              needsYou: w.needsYou,
              draggable: true,
              content: w.id === data.current ? <WorkbenchPanes data={data} ui={ui} onUiChange={change} /> : null,
            }))}
            actions={
              <>
                <Button
                  size="sm"
                  iconOnly
                  aria-label={`New chat in ${current?.label ?? data.current}`}
                  data-figma="150:2"
                >
                  <PlusIcon size="16" />
                </Button>
                <Button size="sm" iconOnly aria-label="Show the workspace sidebar" data-figma="158:2">
                  <PanelIcon size="16" />
                </Button>
              </>
            }
            summary={data.status.summary}
            hints={data.status.hints}
            alert={data.status.alert}
          />
        }
      />
    </Backdrop>
  )
}
