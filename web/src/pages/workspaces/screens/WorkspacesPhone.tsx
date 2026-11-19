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
// (`ui.folderPickerOpen`) under the folders. M9 is a chat held in the list:
// its actions open in the same sheet (`ui.menuFor`, PhoneChatActions with
// `data.phone.rowMenu`) and its row lifts over the scrim. M10 is the chat
// with the keyboard up (`ui.keyboardOpen`): its header shrinks to one line.
// M11 is New chat with the keyboard up: the name has the focus and the start
// bar keeps Start chat alone. M12 is a subagent's full transcript
// (`ui.phoneView: 'transcript'`, PhoneSubagentTranscript), which the chevron
// of its card opens; its trail returns to the subagents or the chat.
// M14 is a workspace's actions (`ui.workspaceMenuFor`, PhoneChatActions with
// `data.phone.workspaceMenu`), a sheet that the ⋯ of its header opens: New
// chat in it, Rename (edit mode with its name a field) and Close (M13's
// dialog). M15 is the menu that + opens over the list (`ui.addMenuOpen`,
// PhoneAddMenu): New chat opens M7 in the current workspace, and New
// workspace adds one (`ui.addedWorkspaces`) with its name a field in edit mode.
// M18 is the Fork form (`ui.chatDialog: 'fork'`, PhoneFork), a sheet over the
// chat that the actions' Fork opens. M20 is the Subtask form (`ui.chatDialog:
// 'subtask'`, PhoneSubtask), a sheet that the actions' Subtask opens. M22 is
// the chat after a move (`ui.toastOpen`): D20's toast over the composer, with
// Undo, which closes it. M23 is the chat's name as a field in its header
// (`ui.renaming`, ChatNameField), which the actions' Rename opens: a tap
// outside saves the name in `ui.names`, × undoes the change; either gives the
// focus back to the message box if it had it before (`ui.refocusMessage`).
// T1 draws the list in edit mode at a tablet's width (`device="tablet"`): the
// tablet's backdrop, shell and tab bar, whose More goes to its page. T2 draws
// the chat with its side chat sheet at a tablet's width, with no tab bar;
// there the chat's ⋯ opens the desktop's chat actions menu (T2b,
// ChatActionsMenu) in place of the phone's sheet. T3 draws the chat's
// subagents at a tablet's width, with Start a subtask under the cards, which
// opens the Subtask form over the chat. T7 opens New chat over the tablet's
// chat as D3's dialog (NewChatDialog), from the chat actions' New chat. T8
// opens the actions' Fork over it as D15's dialog (ForkDialog) in place of
// M18's sheet, and T10 the actions' Subtask as D17's dialog (SubtaskDialog)
// in place of M20's sheet.
// Later phone frames add their views here. Props only; WorkspacesScreen keeps the ui
// and passes `onUiChange`.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ChatActionsMenu } from '../blocks/ChatActionsMenu.tsx'
import { ChatNameField } from '../blocks/ChatNameField.tsx'
import { ChatToast } from '../blocks/ChatToast.tsx'
import { ForkDialog } from '../blocks/ForkDialog.tsx'
import { NewChatDialog } from '../blocks/NewChatDialog.tsx'
import { PhoneChat } from '../blocks/PhoneChat.tsx'
import { PhoneChatActions } from '../blocks/PhoneChatActions.tsx'
import { PhoneFolders } from '../blocks/PhoneFolders.tsx'
import { PhoneFork } from '../blocks/PhoneFork.tsx'
import { PhoneNewChat } from '../blocks/PhoneNewChat.tsx'
import { PhoneSideChat } from '../blocks/PhoneSideChat.tsx'
import { PhoneSubagentTranscript } from '../blocks/PhoneSubagentTranscript.tsx'
import { PhoneSubagents } from '../blocks/PhoneSubagents.tsx'
import { PhoneSubtask } from '../blocks/PhoneSubtask.tsx'
import { PhoneWorkspaceList } from '../blocks/PhoneWorkspaceList.tsx'
import { SubtaskDialog } from '../blocks/SubtaskDialog.tsx'
import type { PhoneText, WorkspacesData, WorkspacesUi } from '../types.ts'

export type WorkspacesPhoneProps = {
  /** The device whose width the screen has: the phone, or a tablet in a state with `tabletList` (T1). */
  device: 'phone' | 'tablet'
  /** The state's data, with the names Erik gave chats in place of their titles. */
  data: WorkspacesData
  /** The phone's labels. */
  text: PhoneText
  ui: WorkspacesUi
  onNavigate?: ((page: string) => void) | undefined
  onUiChange: (change: Partial<WorkspacesUi>) => void
}

export function WorkspacesPhone({ device, data, text, ui, onNavigate, onUiChange }: WorkspacesPhoneProps) {
  // The tab bar's More opens the More drawer over it (Toolkit M4); picking a page navigates.
  const [moreOpen, setMoreOpen] = useState(false)
  const focused = data.panes.find((p) => p.id === ui.focusedPane)
  const chat = ui.phoneView === 'chat' && focused?.type === 'chat' ? focused : undefined
  // M9: the chat of the list whose actions are open, and its workspace.
  const held = data.workspaces
    .flatMap((w) => (w.chats ?? []).map((c) => ({ chat: c, workspace: w.id })))
    .find((h) => h.chat.id === ui.menuFor)
  // M14: the workspace of the list whose actions are open.
  const actionsFor = data.workspaces.find((w) => w.id === ui.workspaceMenuFor)
  const pickWorkspaceAction = (workspace: string, label: string, action: string) => {
    if (action === 'newChat' && data.newChat !== undefined)
      onUiChange({ newChatOpen: true, newChatWorkspace: workspace })
    if (action === 'rename' && text.done !== undefined)
      onUiChange({ editing: true, renamingChats: {}, renamingWorkspaces: { [workspace]: label } })
    if (action === 'close' && text.closeWorkspace?.workspaces[workspace] !== undefined)
      onUiChange({ closing: workspace })
  }
  // M15: the menu that + opens. New chat opens New chat in the current workspace; New workspace adds one and opens
  // its name as a field in edit mode.
  const add = (action: 'newChat' | 'newWorkspace') => {
    if (action === 'newChat') {
      if (data.newChat !== undefined)
        onUiChange({ addMenuOpen: false, newChatOpen: true, newChatWorkspace: data.current })
      return
    }
    const untitled = text.addMenu?.untitled
    if (untitled === undefined || text.done === undefined) return
    const added = ui.addedWorkspaces ?? []
    const id = `new-workspace-${String(added.length + 1)}`
    onUiChange({
      addMenuOpen: false,
      addedWorkspaces: [...added, { id, label: untitled }],
      editing: true,
      renamingChats: {},
      renamingWorkspaces: { [id]: untitled },
    })
  }
  // On the tablet New chat opens over the chat as D3's dialog (T7), drawn with the chat below.
  if (ui.newChatOpen === true && data.newChat !== undefined && (device === 'phone' || chat === undefined))
    return (
      <Backdrop size={device}>
        <AppShell
          size={device}
          view="detail"
          detail={
            <PhoneNewChat
              form={{ ...data.newChat, workspace: ui.newChatWorkspace ?? data.newChat.workspace }}
              workspaces={data.workspaces}
              onCancel={() => {
                onUiChange({ newChatOpen: false, keyboardOpen: false })
              }}
              keyboardOpen={ui.keyboardOpen === true}
              layers={data.layers?.newChatForm}
            />
          }
        />
      </Backdrop>
    )
  const fullLabels = data.subagents?.fullTranscript
  const transcript = data.subagents?.items.find((i) => i.id === ui.subagentFor && i.full !== undefined)
  if (
    ui.phoneView === 'transcript' &&
    focused?.type === 'chat' &&
    data.subagents !== undefined &&
    fullLabels !== undefined &&
    transcript !== undefined
  )
    return (
      <Backdrop size={device}>
        <AppShell
          size={device}
          view="detail"
          detail={
            <PhoneSubagentTranscript
              item={transcript}
              chat={focused.head.title}
              labels={{ ...fullLabels, title: data.subagents.title, stop: data.subagents.stop }}
              onChat={() => {
                onUiChange({ phoneView: 'chat', subagentFor: null })
              }}
              onSubagents={() => {
                onUiChange({ phoneView: 'subagents', subagentFor: null })
              }}
              layers={data.layers?.subagentTranscript}
            />
          }
        />
      </Backdrop>
    )
  // A subagent with no full transcript keeps the subagents on screen, never a blank one.
  if (
    (ui.phoneView === 'subagents' || ui.phoneView === 'transcript') &&
    focused?.type === 'chat' &&
    data.subagents !== undefined
  )
    return (
      <Backdrop size={device}>
        <AppShell
          size={device}
          view="detail"
          detail={
            <PhoneSubagents
              device={device}
              panel={data.subagents}
              chat={focused.head.title}
              onBack={() => {
                onUiChange({ phoneView: 'chat' })
              }}
              open={ui.transcripts ?? []}
              onOpenChange={(transcripts) => {
                onUiChange({ transcripts })
              }}
              onOpenTranscript={
                fullLabels === undefined
                  ? undefined
                  : (subagentFor) => {
                      onUiChange({ phoneView: 'transcript', subagentFor })
                    }
              }
              // T3: Start a subtask opens the Subtask form over the chat, as the chat actions' Subtask does (M20).
              onStartSubtask={
                data.subtask === undefined
                  ? undefined
                  : () => {
                      onUiChange({ phoneView: 'chat', chatDialog: 'subtask' })
                    }
              }
              layers={data.layers}
            />
          }
        />
      </Backdrop>
    )
  // M10: with the keyboard up the chat's header is one line: the model, the context used and the folders.
  const folderCount = data.folders?.chip?.replace('{count}', String(data.folders.items.length))
  const meta =
    chat === undefined || ui.keyboardOpen !== true
      ? undefined
      : [chat.head.model, chat.head.context === undefined ? undefined : `${String(chat.head.context)}%`, folderCount]
          .filter((part) => part !== undefined)
          .join(' · ')
  // M23: the name field closes, saved or undone, and the focus goes back to the message box if it had it before.
  const afterRename: Partial<WorkspacesUi> =
    ui.refocusMessage === true ? { renaming: false, messageFocus: true, refocusMessage: false } : { renaming: false }
  // An action picked in the chat's actions, the phone's sheet (M4) or the tablet's menu (T2b).
  const pickChatAction = (action: string) => {
    // T7: New chat opens in the current chat's workspace.
    if (action === 'newChat' && data.newChat !== undefined)
      onUiChange({ newChatOpen: true, newChatWorkspace: data.current })
    if (action === 'rename')
      onUiChange({ renaming: true, messageFocus: false, refocusMessage: ui.messageFocus === true })
    if (action === 'sideChat' && data.sideChat !== undefined) onUiChange({ sideChatOpen: true })
    if (action === 'fork' && data.fork !== undefined) onUiChange({ chatDialog: 'fork' })
    if (action === 'subtask' && data.subtask !== undefined) onUiChange({ chatDialog: 'subtask' })
    if (action === 'subagents' && data.subagents !== undefined)
      onUiChange({ phoneView: 'subagents', menuFor: null, moveOpen: false })
  }
  if (chat !== undefined)
    return (
      <Backdrop size={device}>
        <AppShell
          size={device}
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
              skills={{
                label: data.skillsLabel,
                matching: data.skillsMatching,
                items: data.skills,
                value: ui.skill,
                open: ui.skillsFor === chat.id,
              }}
              meta={meta}
              focusMessage={ui.messageFocus}
              draft={ui.drafts?.[chat.id]}
              onTextChange={(draft) => {
                onUiChange({ drafts: { ...ui.drafts, [chat.id]: draft } })
              }}
              rename={
                ui.renaming === true ? (
                  <ChatNameField
                    name={chat.head.title}
                    onSave={(name) => {
                      onUiChange({ ...afterRename, names: { ...ui.names, [chat.id]: name } })
                    }}
                    onCancel={() => {
                      onUiChange(afterRename)
                    }}
                    figma={data.layers?.renameField}
                    // T14: at a tablet's width the field is D21's, 300 wide.
                    size={device === 'tablet' ? 'full' : 'phone'}
                  />
                ) : undefined
              }
              above={
                ui.toastOpen === true && data.toast !== undefined ? (
                  <ChatToast
                    text={data.toast.text}
                    action={data.toast.action}
                    onAction={() => {
                      onUiChange({ toastOpen: false })
                    }}
                    figma={data.layers?.toast}
                  />
                ) : undefined
              }
              onSkillsOpenChange={(open) => {
                onUiChange({ skillsFor: open ? chat.id : null })
              }}
              renderMenu={
                device === 'tablet' && data.chatMenu !== undefined
                  ? (trigger) => (
                      <ChatActionsMenu
                        title={chat.head.title}
                        actions={data.chatMenu ?? []}
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
                        highlighted={ui.menuHighlight}
                        onHighlightChange={(menuHighlight) => {
                          onUiChange({ menuHighlight })
                        }}
                        moveTarget={ui.moveTarget}
                        onMoveTargetChange={(moveTarget) => {
                          onUiChange({ moveTarget })
                        }}
                        onSelect={(action) => {
                          onUiChange({ menuFor: null, moveOpen: false })
                          pickChatAction(action)
                        }}
                        figma={{ menu: data.layers?.chatMenu }}
                      />
                    )
                  : text.chatMenu === undefined
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
                          highlight={ui.menuHighlight}
                          onSelect={pickChatAction}
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
                    device={device}
                    chat={chat.head.title}
                    layers={data.layers?.phoneFolders}
                  />
                )
              }
              device={device}
              layers={data.layers}
            />
          }
        />
        {data.sideChat === undefined ? null : (
          <PhoneSideChat
            chat={data.sideChat}
            device={device}
            open={ui.sideChatOpen === true}
            onOpenChange={(sideChatOpen) => {
              onUiChange({ sideChatOpen })
            }}
            layers={data.layers}
          />
        )}
        {data.fork === undefined || device !== 'phone' ? null : (
          <PhoneFork
            form={data.fork}
            chat={chat.head.title}
            open={ui.chatDialog === 'fork'}
            onOpenChange={(open) => {
              onUiChange({ chatDialog: open ? 'fork' : null })
            }}
            layers={data.layers?.phoneFork}
          />
        )}
        {data.subtask === undefined || device !== 'phone' ? null : (
          <PhoneSubtask
            form={data.subtask}
            open={ui.chatDialog === 'subtask'}
            onOpenChange={(open) => {
              onUiChange({ chatDialog: open ? 'subtask' : null })
            }}
            layers={data.layers?.phoneSubtask}
          />
        )}
        {device === 'phone' || data.fork === undefined ? null : (
          <ForkDialog
            form={data.fork}
            chat={chat.head.title}
            open={ui.chatDialog === 'fork'}
            onOpenChange={(open) => {
              onUiChange({ chatDialog: open ? 'fork' : null })
            }}
            layers={data.layers?.forkDialog}
          />
        )}
        {device === 'phone' || data.subtask === undefined ? null : (
          <SubtaskDialog
            form={data.subtask}
            open={ui.chatDialog === 'subtask'}
            onOpenChange={(open) => {
              onUiChange({ chatDialog: open ? 'subtask' : null })
            }}
            layers={data.layers?.subtaskDialog}
          />
        )}
        {device === 'phone' || data.newChat === undefined ? null : (
          <NewChatDialog
            form={{ ...data.newChat, workspace: ui.newChatWorkspace ?? data.newChat.workspace }}
            workspaces={data.workspaces}
            open={ui.newChatOpen === true}
            onOpenChange={(newChatOpen) => {
              onUiChange({ newChatOpen })
            }}
            layers={data.layers?.newChatDialog}
          />
        )}
      </Backdrop>
    )
  return (
    <Backdrop size={device}>
      <AppShell
        size={device}
        view="list"
        // The list runs under the tab bar, as Figma draws the phone pages; its last workspace scrolls clear of the bar
        // (PhoneTabBar.test.tsx). The chat, its subagents and New chat have no tab bar.
        tabBarOverlay
        tabBar={
          <AppTabBar
            selected="workspaces"
            device={device}
            inboxBadge={data.railBadge}
            onSelect={(next) => {
              // The tablet has no More drawer: More goes to its page, as on the Inbox's tablet.
              if (next === 'more' && device === 'phone') setMoreOpen(true)
              else onNavigate?.(next)
            }}
          />
        }
        list={
          <PhoneWorkspaceList
            device={device}
            text={text}
            workspaces={data.workspaces}
            selected={ui.focusedPane}
            openable={data.panes.flatMap((p) => (p.type === 'chat' ? [p.id] : []))}
            ui={ui}
            onUiChange={onUiChange}
            onAdd={add}
            layers={data.layers}
          />
        }
      />
      {held === undefined || text.rowMenu === undefined ? null : (
        <PhoneChatActions
          title={held.chat.title}
          actions={text.rowMenu}
          targets={data.workspaces.filter((w) => w.id !== held.workspace)}
          newWorkspace={data.newWorkspace}
          open
          onOpenChange={(open) => {
            if (!open) onUiChange({ menuFor: null, moveOpen: false, menuHighlight: null })
          }}
          moveOpen={ui.moveOpen}
          onMoveOpenChange={(moveOpen) => {
            onUiChange({ moveOpen })
          }}
          moveTarget={ui.moveTarget}
          onMoveTargetChange={(moveTarget) => {
            onUiChange({ moveTarget })
          }}
          highlight={ui.menuHighlight}
          layers={data.layers?.sheetIcons}
        />
      )}
      {actionsFor === undefined || text.workspaceMenu === undefined ? null : (
        <PhoneChatActions
          title={actionsFor.label}
          actions={text.workspaceMenu.map((a) => ({ ...a, label: a.label.replace('{workspace}', actionsFor.label) }))}
          targets={[]}
          newWorkspace={data.newWorkspace}
          open
          onOpenChange={(open) => {
            if (!open) onUiChange({ workspaceMenuFor: null })
          }}
          moveOpen={false}
          onSelect={(action) => {
            pickWorkspaceAction(actionsFor.id, actionsFor.label, action)
          }}
          layers={data.layers?.sheetIcons}
        />
      )}
      {device === 'phone' ? <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onNavigate={onNavigate} /> : null}
    </Backdrop>
  )
}
