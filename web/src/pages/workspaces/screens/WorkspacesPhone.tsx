// The Workspaces page on the phone (Figma M1 to M23): one view at a time over
// the shared tab bar, which More turns into the More drawer. M1 is the home:
// every workspace and its chats (PhoneWorkspaceList); M2 its edit mode. M3
// is a chat (`ui.phoneView: 'chat'`, PhoneChat): it fills the screen with no
// tab bar, and its back button returns to the list. M4 is the chat's actions
// (`ui.menuFor`, PhoneChatActions), a sheet that its ⋯ opens. M5 is the
// side chat (`ui.sideChatOpen`, PhoneSideChat), a sheet over the chat that
// the actions' Side chat opens. M6 is the chat's subagents (`ui.phoneView:
// 'subagents'`, PhoneSubagents), which the actions' Subagents opens and
// whose back row returns to the chat. M7 is New chat (`ui.newChatOpen`,
// PhoneNewChat), which fills the screen with no tab bar; Cancel closes it.
// M8 is the chat's folders (`ui.foldersOpen`, PhoneFolders), a sheet that the
// folders chip in the chat's header opens, with the folder picker
// (`ui.folderPickerOpen`) under the folders.
// Later phone frames add their views here. Props only; WorkspacesScreen keeps the ui
// and passes `onUiChange`.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { PhoneChat } from '../blocks/PhoneChat.tsx'
import { PhoneChatActions } from '../blocks/PhoneChatActions.tsx'
import { PhoneFolders } from '../blocks/PhoneFolders.tsx'
import { PhoneNewChat } from '../blocks/PhoneNewChat.tsx'
import { PhoneSideChat } from '../blocks/PhoneSideChat.tsx'
import { PhoneSubagents } from '../blocks/PhoneSubagents.tsx'
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
  if (ui.newChatOpen === true && data.newChat !== undefined)
    return (
      <Backdrop size="phone">
        <AppShell
          size="phone"
          view="detail"
          detail={
            <PhoneNewChat
              form={data.newChat}
              workspaces={data.workspaces}
              onCancel={() => {
                onUiChange({ newChatOpen: false })
              }}
              layers={data.layers?.newChatForm}
            />
          }
        />
      </Backdrop>
    )
  if (ui.phoneView === 'subagents' && focused?.type === 'chat' && data.subagents !== undefined)
    return (
      <Backdrop size="phone">
        <AppShell
          size="phone"
          view="detail"
          detail={
            <PhoneSubagents
              panel={data.subagents}
              chat={focused.head.title}
              onBack={() => {
                onUiChange({ phoneView: 'chat' })
              }}
              open={ui.transcripts ?? []}
              onOpenChange={(transcripts) => {
                onUiChange({ transcripts })
              }}
              layers={data.layers}
            />
          }
        />
      </Backdrop>
    )
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
                onUiChange({ phoneView: 'list', skillsFor: null, menuFor: null, moveOpen: false, sideChatOpen: false })
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
                        onSelect={(action) => {
                          if (action === 'sideChat' && data.sideChat !== undefined) onUiChange({ sideChatOpen: true })
                          if (action === 'subagents' && data.subagents !== undefined)
                            onUiChange({ phoneView: 'subagents', menuFor: null, moveOpen: false })
                        }}
                        layers={data.layers?.sheetIcons}
                      />
                    )
              }
              noActions={data.chatActions === false}
              folders={
                data.folders?.chip === undefined ? undefined : (
                  <PhoneFolders
                    folders={data.folders}
                    chip={data.folders.chip}
                    picker={data.folderPicker}
                    open={ui.foldersOpen === true}
                    onOpenChange={(foldersOpen) => {
                      onUiChange({ foldersOpen })
                    }}
                    pickerOpen={ui.folderPickerOpen === true}
                    onPickerOpenChange={(folderPickerOpen) => {
                      onUiChange({ folderPickerOpen })
                    }}
                    picked={ui.pickedFolder ?? null}
                    onPick={(pickedFolder) => {
                      onUiChange({ pickedFolder })
                    }}
                    layers={data.layers?.phoneFolders}
                  />
                )
              }
              layers={data.layers}
            />
          }
        />
        {data.sideChat === undefined ? null : (
          <PhoneSideChat
            chat={data.sideChat}
            open={ui.sideChatOpen === true}
            onOpenChange={(sideChatOpen) => {
              onUiChange({ sideChatOpen })
            }}
            layers={data.layers}
          />
        )}
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
