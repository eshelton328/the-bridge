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
// A live Claude chat's ⋯ offers /compact and /clear after any other actions
// (W5); the screen draws their dialog. A live chat's ⋯ ends with Close
// pane… (W2), whose dialog the screen draws too; a live chat's Rename saves
// through `edits.renameChat` (R42), and the live list's edit mode through
// `edits` (R41, PhoneWorkspaceList); the phone and the tablet's
// chat have no zoom, swap or focus, as one chat fills the screen. // Later phone frames add their views here. Props only; WorkspacesScreen keeps the ui
// and passes `onUiChange`.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { type ReactNode, useRef, useState } from 'react'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { SlotBoundary } from '../../../errors/SlotBoundary.tsx'
import { ChatActionsMenu } from '../blocks/ChatActionsMenu.tsx'
import { ChatNameField } from '../blocks/ChatNameField.tsx'
import { ChatToast } from '../blocks/ChatToast.tsx'
import { ForkDialog } from '../blocks/ForkDialog.tsx'
import { NewChatDialog } from '../blocks/NewChatDialog.tsx'
import { PhoneChat } from '../blocks/PhoneChat.tsx'
import { moveOrAsk } from '../blocks/moveToWorkspace.ts'
import { PhoneChatActions } from '../blocks/PhoneChatActions.tsx'
import { PhoneFolders } from '../blocks/PhoneFolders.tsx'
import { PhoneFork } from '../blocks/PhoneFork.tsx'
import { PhoneNewChat } from '../blocks/PhoneNewChat.tsx'
import { PhoneSideChat } from '../blocks/PhoneSideChat.tsx'
import { PhoneSubagentTranscript } from '../blocks/PhoneSubagentTranscript.tsx'
import { PhoneSubagents } from '../blocks/PhoneSubagents.tsx'
import { PhoneSubtask } from '../blocks/PhoneSubtask.tsx'
import { PhoneWorkspaceList, RowMenuButton } from '../blocks/PhoneWorkspaceList.tsx'
import { LiftedChatRow } from '../blocks/SidebarChatRow.tsx'
import { SubtaskDialog } from '../blocks/SubtaskDialog.tsx'
import type { CopyReply } from '../blocks/ChatEntryView.tsx'
import { blockedDialog, type ChatDialog } from '../blocks/chatDialog.ts'
import type { ChatFiles, ChatPending, TranscriptWatch } from '../blocks/ChatPane.tsx'
import type { EffortControl } from '../blocks/EffortPicker.tsx'
import type { DraftBook } from '../blocks/draftBook.ts'
import type { SkillLists } from '../blocks/skillLists.ts'
import { liveSkillList } from '../blocks/useSkillRows.ts'
import { isChatCommand, withCommands } from '../blocks/chatCommands.ts'
import { type LayoutWrites, tabOf, withLayoutActions } from '../blocks/layoutActions.ts'
import { modelText } from '../blocks/modelText.ts'
import { openChat } from '../blocks/workspaceLayout.ts'
import { type NewChatStarter, startOf } from '../blocks/newChatStart.ts'
import type { PhoneText, WorkspaceEdits, WorkspacesData, WorkspacesUi } from '../types.ts'
import type { ComposerAnswer } from '../blocks/useComposerActions.ts'
import { type ChatWidth, defaultVisiblePages, type BarPage, navLayout } from '../../../lib/deviceSettings.ts'

export type WorkspacesPhoneProps = {
  /** Draws the Settings gear in the rail and the Settings row in the More drawer (d-119): the page entry passes it; a Figma state does not. */
  settingsEntry?: boolean | undefined
  /** The device whose width the screen has: the phone, or a tablet in a state with `tabletList` (T1). */
  device: 'phone' | 'tablet'
  /** The state's data, with the names the owner gave chats in place of their titles. */
  data: WorkspacesData
  /** The phone's labels. */
  text: PhoneText
  ui: WorkspacesUi
  onNavigate?: ((page: string) => void) | undefined
  /** The shown nav pages in the owner's order (d-038, d-119); the default order without it, as the Figma states draw. */
  navPages?: readonly BarPage[] | undefined
  onUiChange: (change: Partial<WorkspacesUi>) => void
  /** The composer drafts by chat (draftBook.ts): a chat's composer starts from its draft and sets it as the owner types. */
  drafts: DraftBook
  /** Sends a chat's message; resolves `false` when the send failed, and the composer keeps the draft (ChatPane). */
  onSend?: ((chat: string, text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops a chat: its running composer's Stop (ChatPane `onStop`). */
  onStop?: ((chat: string) => Promise<ComposerAnswer>) | undefined
  /** A live Claude chat's files (W1b), by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `files`). */
  filesOf?: ((chat: string) => ChatFiles | undefined) | undefined
  /** A live Claude chat's pending send, by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `pending`). */
  pendingOf?: ((chat: string) => ChatPending | undefined) | undefined
  /** A live Claude chat's terminal dialog source, by chat id, read while the chat needs the owner (R69); none for a sample chat. */
  dialogOf?: ((chat: string) => ChatDialog | undefined) | undefined
  /** A live Claude chat's effort picker (W10), by chat id; none for a sample chat, a Codex chat or a shell. */
  effortOf?: ((chat: string) => EffortControl | undefined) | undefined
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** How wide the chat draws on the tablet and the desktop (Settings → Appearance); full when not set. */
  chatWidth?: ChatWidth | undefined
  /** Reads each live Claude chat's "/" list each time it opens (review R34); fixtures have none. */
  skillLists?: SkillLists | undefined
  /** A reply's Copy, sample or live: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /** The live-unavailable notice (LiveNotice), drawn at the top of the list and of a chat; none when not set. */
  notice?: ReactNode
  /** The live chats' layout writes (W2): only Close pane… here; none on a fixture. */
  layoutWrites?: LayoutWrites | undefined
  /** Starts a live chat from New chat (W3); none on a fixture. */
  newChat?: NewChatStarter | undefined
  /** The live list's edits (R41, R42): renames and the order go to the server; none on a fixture. */
  edits?: WorkspaceEdits | undefined
  /** Asks a live Claude chat's side question (useSideChats.ts), by chat id; none on a fixture. */
  onSideAsk?: ((chat: string, question: string) => Promise<ComposerAnswer>) | undefined
  /** Stops a live Claude chat's side answer (the side composer's Stop), by chat id; none on a fixture. */
  onSideStop?: ((chat: string) => Promise<ComposerAnswer>) | undefined
  /**
   * The page waits for its first workspace list (R58): the list draws its real header with its controls off, and
   * workspaces that load in place of the groups. Only the phone's and the tablet's list draw it.
   */
  loading?: boolean | undefined
}

export function WorkspacesPhone({
  device,
  data,
  text,
  ui,
  onNavigate,
  settingsEntry,
  navPages = defaultVisiblePages,
  onUiChange,
  drafts,
  onSend,
  onStop,
  filesOf,
  pendingOf,
  dialogOf,
  effortOf,
  transcripts,
  chatWidth,
  skillLists,
  onCopy,
  notice,
  layoutWrites,
  newChat,
  edits,
  onSideAsk,
  onSideStop,
  loading,
}: WorkspacesPhoneProps) {
  // The tab bar's More opens the More drawer over it (Toolkit M4); picking a page navigates.
  const [moreOpen, setMoreOpen] = useState(false)
  const focused = data.panes.find((p) => p.id === ui.focusedPane)
  const chat = ui.phoneView === 'chat' && focused?.type === 'chat' ? focused : undefined
  // The workspace that holds the open chat: a live state's panes hold every chat of every workspace (d-117), so the
  // chat may be another workspace's than `data.current`. A chat no workspace lists (a fixture's) is the current one's.
  const chatWorkspace =
    chat === undefined
      ? data.current
      : (data.workspaces.find((w) => w.chats?.some((c) => c.id === chat.id))?.id ?? data.current)
  // M9: the chat of the list whose actions are open, and its workspace. Its row takes `heldRowRef`, and the actions
  // sheet lifts a copy of the row over its scrim there (BottomSheet `lifted`).
  const heldRowRef = useRef<HTMLDivElement>(null)
  const held = data.workspaces
    .flatMap((w) => (w.chats ?? []).map((c) => ({ chat: c, workspace: w.id })))
    .find((h) => h.chat.id === ui.menuFor)
  // M14: the workspace of the list whose actions are open.
  const actionsFor = data.workspaces.find((w) => w.id === ui.workspaceMenuFor)
  const pickWorkspaceAction = (workspace: string, label: string, action: string) => {
    if (action === 'newChat' && data.newChat !== undefined)
      onUiChange({ newChatOpen: true, newChatWorkspace: workspace, newChatBeside: null, newChatStart: null })
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
        onUiChange({
          addMenuOpen: false,
          newChatOpen: true,
          newChatWorkspace: data.current,
          newChatBeside: null,
          newChatStart: null,
        })
      return
    }
    // The live page (W4): New workspace asks for the name in its dialog, which the screen draws at every size.
    if (edits !== undefined) {
      onUiChange({ addMenuOpen: false, newWorkspaceOpen: true })
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
  // A view that fills the screen has no tab bar, so its slot's fallback (audit W-4) goes back to the list.
  const backToList = {
    label: 'Back to the list',
    onClick: () => {
      onUiChange({
        phoneView: 'list',
        newChatOpen: false,
        keyboardOpen: false,
        subagentFor: null,
        skillsFor: null,
        menuFor: null,
        moveOpen: false,
        sideChatOpen: false,
      })
    },
  }
  // On the tablet New chat opens over the chat as D3's dialog (T7), drawn with the chat below.
  if (ui.newChatOpen === true && data.newChat !== undefined && (device === 'phone' || chat === undefined))
    return (
      <Backdrop size={device}>
        <AppShell
          onDiagnostic={reportShellDiagnostic}
          size={device}
          view="detail"
          detail={
            <SlotBoundary contentKey="newChat" secondary={backToList}>
              <PhoneNewChat
                form={{ ...data.newChat, workspace: ui.newChatWorkspace ?? data.newChat.workspace }}
                workspaces={data.workspaces}
                onCancel={() => {
                  onUiChange({ newChatOpen: false, keyboardOpen: false, newChatStart: null, newChatBeside: null })
                }}
                keyboardOpen={ui.keyboardOpen === true}
                layers={data.layers?.newChatForm}
                start={startOf(newChat, data, ui)}
              />
            </SlotBoundary>
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
          onDiagnostic={reportShellDiagnostic}
          size={device}
          view="detail"
          detail={
            <SlotBoundary contentKey={`transcript:${transcript.id}`} secondary={backToList}>
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
                onCopy={onCopy}
              />
            </SlotBoundary>
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
          onDiagnostic={reportShellDiagnostic}
          size={device}
          view="detail"
          detail={
            <SlotBoundary contentKey={`subagents:${focused.id}`} secondary={backToList}>
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
            </SlotBoundary>
          }
        />
      </Backdrop>
    )
  // M10: with the keyboard up the chat's header is one line: the model, the context used and the folders.
  const folderCount = data.folders?.chip?.replace('{count}', String(data.folders.items.length))
  const meta =
    chat === undefined || ui.keyboardOpen !== true
      ? undefined
      : [
          modelText(chat.head),
          chat.head.context === undefined ? undefined : `${String(chat.head.context)}%`,
          folderCount,
        ]
          .filter((part) => part !== undefined)
          .join(' · ')
  // M23: the name field closes, saved or undone, and the focus goes back to the message box if it had it before.
  const afterRename: Partial<WorkspacesUi> =
    ui.refocusMessage === true ? { renaming: false, messageFocus: true, refocusMessage: false } : { renaming: false }
  // An action picked in the chat's actions, the phone's sheet (M4) or the tablet's menu (T2b).
  const pickChatAction = (action: string) => {
    // T7: New chat opens in the current chat's workspace; a live chat starts beside this one (W3).
    if (action === 'newChat' && data.newChat !== undefined)
      onUiChange({
        newChatOpen: true,
        newChatWorkspace: chatWorkspace,
        newChatBeside: layoutWrites === undefined ? null : ui.focusedPane,
        newChatStart: null,
        menuFor: null,
        moveOpen: false,
      })
    if (action === 'rename')
      onUiChange({ renaming: true, messageFocus: false, refocusMessage: ui.messageFocus === true })
    // M5: the side chat opens as a sheet over the chat; a live one asks about this chat.
    if (action === 'sideChat' && (data.sideChat !== undefined || onSideAsk !== undefined))
      onUiChange({ sideChatOpen: true, sideChatFor: ui.focusedPane, menuFor: null, moveOpen: false })
    if (action === 'fork' && data.fork !== undefined) onUiChange({ chatDialog: 'fork' })
    // A live Claude chat's Fork starts its copy beside it (backend #443); it opens once the list shows it.
    if (action === 'fork' && edits !== undefined && chat !== undefined) {
      onUiChange({ menuFor: null, moveOpen: false })
      edits.forkChat(chat.id)
    }
    if (action === 'subtask' && data.subtask !== undefined) onUiChange({ chatDialog: 'subtask' })
    if (action === 'subagents' && data.subagents !== undefined)
      onUiChange({ phoneView: 'subagents', menuFor: null, moveOpen: false })
    // W5: a live Claude chat's /compact or /clear opens its dialog over the chat.
    if (isChatCommand(action))
      onUiChange({ chatDialog: action, commandFor: ui.focusedPane, menuFor: null, moveOpen: false })
    // W2: a live chat's Close pane… asks first, in the screen's dialog.
    if (action === 'close' && layoutWrites !== undefined && tabOf(data, ui.focusedPane) !== undefined)
      onUiChange({ chatDialog: 'close', commandFor: ui.focusedPane, menuFor: null, moveOpen: false })
  }
  // A live chat's Move to workspace (backend #435): it moves, or the screen asks first when it is its workspace's last.
  const moving = chat?.id
  const moveChat =
    edits === undefined || moving === undefined
      ? undefined
      : (workspace: string) => {
          onUiChange(moveOrAsk(data, edits, moving, workspace))
        }
  // The chat's actions with a live Claude chat's commands after them (W5): the tablet's menu and the phone's sheet.
  const liveChat = layoutWrites === undefined ? undefined : chat?.id
  const tabletActions =
    data.chatMenu === undefined
      ? undefined
      : withCommands(withLayoutActions(data.chatMenu, data, liveChat, 'chat'), chat, data.chatCommands)
  const phoneActions = withCommands(
    withLayoutActions(text.chatMenu ?? [], data, liveChat, 'chat'),
    chat,
    data.chatCommands,
  )
  if (chat !== undefined)
    return (
      <Backdrop size={device}>
        <AppShell
          onDiagnostic={reportShellDiagnostic}
          size={device}
          view="detail"
          detail={
            <SlotBoundary contentKey={chat.id} secondary={backToList}>
              <PhoneChat
                pane={chat}
                workspace={data.workspaces.find((w) => w.id === chatWorkspace)?.label ?? chatWorkspace ?? ''}
                contextLabel={data.sidebar?.contextLabel ?? ''}
                backLabel={text.back ?? text.title}
                notice={notice}
                onBack={() => {
                  onUiChange({
                    phoneView: 'list',
                    skillsFor: null,
                    menuFor: null,
                    moveOpen: false,
                    sideChatOpen: false,
                  })
                }}
                skills={{
                  label: data.skillsLabel,
                  matching: data.skillsMatching,
                  items: data.skills,
                  value: ui.skill,
                  open: ui.skillsFor === chat.id,
                  live: liveSkillList(skillLists, chat, onUiChange),
                }}
                meta={meta}
                focusMessage={ui.messageFocus}
                drafts={drafts}
                onSend={onSend && ((message) => onSend(chat.id, message))}
                onStop={onStop && (() => onStop(chat.id))}
                files={filesOf?.(chat.id)}
                pending={pendingOf?.(chat.id)}
                dialog={blockedDialog(chat, dialogOf)}
                effort={effortOf?.(chat.id)}
                transcripts={transcripts}
                chatWidth={chatWidth}
                onCopy={onCopy}
                rename={
                  ui.renaming === true ? (
                    <ChatNameField
                      name={chat.head.title}
                      onSave={(name) => {
                        // Live, the name goes to the server and shows from the next list read, never from `ui`.
                        if (edits === undefined) onUiChange({ ...afterRename, names: { ...ui.names, [chat.id]: name } })
                        else {
                          edits.renameChat(chat.id, name, chat.head.title)
                          onUiChange(afterRename)
                        }
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
                  device === 'tablet' && tabletActions !== undefined
                    ? (trigger) => (
                        <ChatActionsMenu
                          title={chat.head.title}
                          actions={tabletActions}
                          targets={data.workspaces.filter((w) => w.id !== chatWorkspace)}
                          newWorkspace={data.newWorkspace}
                          trigger={trigger}
                          onMove={moveChat}
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
                    : phoneActions.length === 0
                      ? undefined
                      : (trigger) => (
                          <PhoneChatActions
                            title={chat.head.title}
                            actions={phoneActions}
                            targets={data.workspaces.filter((w) => w.id !== chatWorkspace)}
                            newWorkspace={data.newWorkspace}
                            trigger={trigger}
                            onMove={moveChat}
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
            </SlotBoundary>
          }
        />
        {data.sideChat === undefined || (onSideAsk !== undefined && data.sideChat.pane !== ui.focusedPane) ? null : (
          <PhoneSideChat
            chat={data.sideChat}
            device={device}
            open={ui.sideChatOpen === true}
            onOpenChange={(sideChatOpen) => {
              onUiChange({ sideChatOpen })
            }}
            layers={data.layers}
            onCopy={onCopy}
            onSend={onSideAsk === undefined ? undefined : (text) => onSideAsk(ui.focusedPane, text)}
            onStop={onSideStop === undefined ? undefined : () => onSideStop(ui.focusedPane)}
            drafts={drafts}
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
            key={ui.newChatOpen === true ? 'open' : 'closed'}
            form={{ ...data.newChat, workspace: ui.newChatWorkspace ?? data.newChat.workspace }}
            workspaces={data.workspaces}
            open={ui.newChatOpen === true}
            onOpenChange={(newChatOpen) => {
              onUiChange(newChatOpen ? { newChatOpen } : { newChatOpen, newChatStart: null, newChatBeside: null })
            }}
            layers={data.layers?.newChatDialog}
            start={startOf(newChat, data, ui)}
          />
        )}
      </Backdrop>
    )
  return (
    <Backdrop size={device}>
      <AppShell
        onDiagnostic={reportShellDiagnostic}
        size={device}
        view="list"
        // The list runs under the tab bar, as Figma draws the phone pages; its last workspace scrolls clear of the bar
        // (PhoneTabBar.test.tsx). The chat, its subagents and New chat have no tab bar.
        tabBarOverlay
        tabBar={
          <AppTabBar
            selected="workspaces"
            pages={navLayout(navPages, device).tabs}
            more={navLayout(navPages, device).more.length > 0}
            device={device}
            inboxBadge={data.railBadge}
            onSelect={(next) => {
              // The phone's and the tablet's More open the drawer (d-119).
              if (next === 'more') setMoreOpen(true)
              else onNavigate?.(next)
            }}
          />
        }
        list={
          <SlotBoundary contentKey="list">
            <PhoneWorkspaceList
              device={device}
              text={text}
              workspaces={data.workspaces}
              openable={data.panes.flatMap((p) => (p.type === 'chat' ? [p.id] : []))}
              ui={ui}
              onUiChange={onUiChange}
              onAdd={add}
              layers={data.layers}
              heldRow={heldRowRef}
              notice={notice}
              edits={edits}
              loading={loading}
              onOpenChat={(chat) => {
                onUiChange({ ...openChat(data, ui, chat), phoneView: 'chat' })
              }}
            />
          </SlotBoundary>
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
          lifted={{
            content: (
              <LiftedChatRow
                chat={held.chat}
                figma={data.layers?.liftedRow}
                menu={<RowMenuButton chat={held.chat} layer={data.layers?.liftedMenu} />}
              />
            ),
            anchor: heldRowRef,
          }}
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
      <MoreDrawer
        settings={settingsEntry}
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pages={navLayout(navPages, device).more}
        selected="workspaces"
        onNavigate={onNavigate}
      />
    </Backdrop>
  )
}
