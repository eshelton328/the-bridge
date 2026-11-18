// The Workspaces page on the phone (Figma M1 to M23): one view at a time over
// the shared tab bar, which More turns into the More drawer. M1 is the home:
// every workspace and its chats (PhoneWorkspaceList); M2 its edit mode. M3
// is a chat (`ui.phoneView: 'chat'`, PhoneChat): it fills the screen with no
// tab bar, and its back button returns to the list. M4 is the chat's actions
// (`ui.menuFor`, PhoneChatActions), a sheet that its ⋯ opens. Later phone
// frames (the side chat sheet, subagents, New chat, folders) add their
// views here. Props only; WorkspacesScreen keeps the ui
// and passes `onUiChange`.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { PhoneChat } from '../blocks/PhoneChat.tsx'
import { PhoneChatActions } from '../blocks/PhoneChatActions.tsx'
import { PhoneWorkspaceList } from '../blocks/PhoneWorkspaceList.tsx'
import type { PhoneText, WorkspacesData, WorkspacesUi } from '../types.ts'

export type WorkspacesPhoneProps = {
  /** The state's data, with the names Erik gave chats in place of their titles. */
  data: WorkspacesData
  /** The phone's labels. */
  text: PhoneText
  ui: WorkspacesUi
  onNavigate?: ((page: string) => void) | undefined
  onUiChange: (change: Partial<WorkspacesUi>) => void
}

export function WorkspacesPhone({ data, text, ui, onNavigate, onUiChange }: WorkspacesPhoneProps) {
  // The tab bar's More opens the More drawer over it (Toolkit M4); picking a page navigates.
  const [moreOpen, setMoreOpen] = useState(false)
  const focused = data.panes.find((p) => p.id === ui.focusedPane)
  const chat = ui.phoneView === 'chat' && focused?.type === 'chat' ? focused : undefined
  if (chat !== undefined)
    return (
      <Backdrop size="phone">
        <AppShell
          size="phone"
          view="detail"
          detail={
            <PhoneChat
              pane={chat}
              workspace={data.workspaces.find((w) => w.id === data.current)?.label ?? data.current}
              contextLabel={data.sidebar?.contextLabel ?? ''}
              backLabel={text.back ?? text.title}
              onBack={() => {
                onUiChange({ phoneView: 'list', skillsFor: null, menuFor: null, moveOpen: false })
              }}
              skills={{ label: data.skillsLabel, items: data.skills, value: ui.skill, open: ui.skillsFor === chat.id }}
              onSkillsOpenChange={(open) => {
                onUiChange({ skillsFor: open ? chat.id : null })
              }}
              renderMenu={
                text.chatMenu === undefined
                  ? undefined
                  : (trigger) => (
                      <PhoneChatActions
                        title={chat.head.title}
                        actions={text.chatMenu ?? []}
                        targets={data.workspaces.filter((w) => w.id !== data.current)}
                        newWorkspace={data.newWorkspace}
                        trigger={trigger}
                        open={ui.menuFor === chat.id}
                        onOpenChange={(open) => {
                          onUiChange({ menuFor: open ? chat.id : null, moveOpen: false })
                        }}
                        moveOpen={ui.menuFor === chat.id && ui.moveOpen}
                        onMoveOpenChange={(moveOpen) => {
                          onUiChange({ moveOpen })
                        }}
                        moveTarget={ui.moveTarget}
                        onMoveTargetChange={(moveTarget) => {
                          onUiChange({ moveTarget })
                        }}
                        layers={data.layers?.sheetIcons}
                      />
                    )
              }
              layers={data.layers}
            />
          }
        />
      </Backdrop>
    )
  return (
    <Backdrop size="phone">
      <AppShell
        size="phone"
        view="list"
        tabBar={
          <AppTabBar
            selected="workspaces"
            device="phone"
            inboxBadge={data.railBadge}
            onSelect={(next) => {
              if (next === 'more') setMoreOpen(true)
              else onNavigate?.(next)
            }}
          />
        }
        list={
          <PhoneWorkspaceList
            text={text}
            workspaces={data.workspaces}
            selected={ui.focusedPane}
            openable={data.panes.flatMap((p) => (p.type === 'chat' ? [p.id] : []))}
            ui={ui}
            onUiChange={onUiChange}
            layers={data.layers}
          />
        }
      />
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onNavigate={onNavigate} />
    </Backdrop>
  )
}
