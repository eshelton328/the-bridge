// The Workspaces page (Figma Workbench) as one props-only screen: the rail,
// then the Workbench: the workspace tabs with the sidebar toggle and New
// chat, the current workspace's split panes and the status bar (D1). A
// state file's data and ui are its props. What the owner opens or closes
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
// alone, and a toast over its composer confirms a move, with Undo (D20).
// Rename chat turns the chat's name in its header into a field (D21).
// The screen lays out by its width (ViewportFrame): a state with the phone's
// labels draws the phone layout at a phone's width (M1, WorkspacesPhone),
// and at a tablet's width too when it has `tabletList` (T1); every other
// width, and a state without them, draws the desktop layout. With
// `liveNotice` (the live source could not be read) each layout draws the
// notice at the top of its content until the owner dismisses it, with Retry
// when the page passes `onRetry` (LiveNotice). A live Claude chat's actions
// end with /compact and /clear (W5, chatCommands.ts), each of which opens its
// dialog over every layout for that chat (`ui.chatDialog`, ChatCommandDialog)
// and posts through `onCommand`. A live chat's layout writes (W2, `layout`):
// the workbench's panes zoom, swap and focus, and every layout's chat
// actions end with Close pane…, whose dialog (CloseChatDialog) shows over
// every layout for the chat in `ui.commandFor`; the chat beside the sidebar
// focuses on a tap on its header or a Send. The phone and the tablet's chat
// send no focus. A tab picked in a workbench pane's Move to tab… opens its
// dialog (MoveChatDialog, W2d) for the chat in `ui.commandFor` and the tab in
// `ui.moveToTab`, while both are still in the layout read; the workbench
// follows the move of its focused pane. The live list's edits (`edits`,
// reviews R41, R42) rename a chat from its Rename and a workspace or the
// order from the phone's and tablet's edit mode; their line draws under the
// live notice in every layout, with Dismiss.
import type { ChatCommandRequest } from '@bridge/contract'
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import { SlotBoundary } from '../../../errors/SlotBoundary.tsx'
import { defaultVisiblePages, type NavPage, navLayout } from '../../../lib/deviceSettings.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { css } from '../../../../styled-system/css/index.js'
import { LiveNotice } from '../blocks/LiveNotice.tsx'
import { TranscriptProblem } from '../blocks/TranscriptProblem.tsx'
import { MainChat } from '../blocks/MainChat.tsx'
import { NewChatDialog } from '../blocks/NewChatDialog.tsx'
import { SubagentsPane } from '../blocks/SubagentsPane.tsx'
import { SubtaskDialog } from '../blocks/SubtaskDialog.tsx'
import { ChatActionsMenu } from '../blocks/ChatActionsMenu.tsx'
import { ChatCommandDialog } from '../blocks/ChatCommandDialog.tsx'
import { isChatCommand, withCommands } from '../blocks/chatCommands.ts'
import { CloseChatDialog } from '../blocks/CloseChatDialog.tsx'
import { type LayoutWrites, tabOf, withLayoutActions } from '../blocks/layoutActions.ts'
import { MoveChatDialog } from '../blocks/MoveChatDialog.tsx'
import { MoveWorkspaceDialog } from '../blocks/MoveWorkspaceDialog.tsx'
import { moveOrAsk, workspaceOf } from '../blocks/moveToWorkspace.ts'
import { ChatNameField } from '../blocks/ChatNameField.tsx'
import { ChatToast } from '../blocks/ChatToast.tsx'
import { ForkDialog } from '../blocks/ForkDialog.tsx'
import { FolderPickerPane } from '../blocks/FolderPickerPane.tsx'
import { FoldersControl } from '../blocks/FoldersControl.tsx'
import { PaneDropZone } from '../blocks/PaneDropZone.tsx'
import { SideChatPanel } from '../blocks/SideChatPanel.tsx'
import { WorkspaceSidebar } from '../blocks/WorkspaceSidebar.tsx'
import { WorkspaceTabs } from '../blocks/WorkspaceTabs.tsx'
import type { CopyReply } from '../blocks/ChatEntryView.tsx'
import type { ChatFiles, ChatPending, TranscriptWatch } from '../blocks/ChatPane.tsx'
import type { EffortControl } from '../blocks/EffortPicker.tsx'
import type { SkillLists } from '../blocks/skillLists.ts'
import { type NewChatStarter, startOf } from '../blocks/newChatStart.ts'
import { liveSkillList } from '../blocks/useSkillRows.ts'
import { createDraftBook, type DraftBook } from '../blocks/draftBook.ts'
import { openableChats, openChat, shownView } from '../blocks/workspaceLayout.ts'
import type { WorkspaceEdits, WorkspacesData, WorkspacesUi } from '../types.ts'
import { WorkspacesPhone } from './WorkspacesPhone.tsx'
import type { ComposerAnswer } from '../blocks/useComposerActions.ts'

// The rail's slot is a flex column; the rail fills it.
const railSlot = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type WorkspacesScreenProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** The shown nav pages in the owner's order (d-038, d-119); the default order without it, as the Figma states draw. */
  navPages?: readonly NavPage[] | undefined
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** Sends a chat's message; resolves `false` when the send failed, and the composer keeps the draft (ChatPane). */
  onSend?: ((chat: string, text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops a chat: its running composer's Stop (ChatPane `onStop`). */
  onStop?: ((chat: string) => Promise<ComposerAnswer>) | undefined
  /** A live Claude chat's files (W1b), by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `files`). */
  filesOf?: ((chat: string) => ChatFiles | undefined) | undefined
  /** A live Claude chat's pending send, by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `pending`). */
  pendingOf?: ((chat: string) => ChatPending | undefined) | undefined
  /** A live Claude chat's effort picker (W10), by chat id; none for a sample chat, a Codex chat or a shell. */
  effortOf?: ((chat: string) => EffortControl | undefined) | undefined
  /** Sends a live Claude chat's /compact or /clear from its dialog (W5); answers as `onSend` does. */
  onCommand?: ((chat: string, request: ChatCommandRequest) => Promise<ComposerAnswer>) | undefined
  /** Reads the live source again: the live-unavailable notice's Retry. */
  onRetry?: (() => void) | undefined
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** Reads each live Claude chat's "/" list each time it opens (review R34); fixtures have none. */
  skillLists?: SkillLists | undefined
  /** A reply's Copy, sample or live: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /**
   * The composer drafts by chat (review R28, draftBook.ts), which the page keeps and saves; not set, the screen keeps
   * its own, starting from `ui.drafts`. A keystroke changes only its chat's composer, never the `ui`.
   */
  drafts?: DraftBook | undefined
  /** The live chats' layout writes (W2): focus, zoom, swap and close; none on a fixture. */
  layoutWrites?: LayoutWrites | undefined
  /** Starts a live chat from New chat (W3); none on a fixture. */
  newChat?: NewChatStarter | undefined
  /** The live list's edits (R41, R42): renames and the workspaces' order; none on a fixture. */
  edits?: WorkspaceEdits | undefined
}

export function WorkspacesScreen({
  data,
  ui: stateUi,
  viewport,
  onNavigate,
  navPages,
  onUiChange,
  onSend,
  onStop,
  filesOf,
  pendingOf,
  effortOf,
  onCommand,
  onRetry,
  transcripts,
  skillLists,
  onCopy,
  drafts: pageDrafts,
  layoutWrites,
  newChat,
  edits,
}: WorkspacesScreenProps) {
  const [changed, setChanged] = useState<{ of: WorkspacesUi; ui: WorkspacesUi }>({ of: stateUi, ui: stateUi })
  const ui = changed.of === stateUi ? changed.ui : stateUi
  // Merge each change into the latest ui, not this render's: one event can report two changes, such as Rename
  // chat's pick and then the menu's close, and the second must not drop the first.
  const latestRef = useRef(ui)
  useLayoutEffect(() => {
    latestRef.current = ui
  })
  const change = (next: Partial<WorkspacesUi>) => {
    latestRef.current = { ...latestRef.current, ...next }
    setChanged((prev) => ({ of: stateUi, ui: { ...(prev.of === stateUi ? prev.ui : stateUi), ...next } }))
    onUiChange?.(next)
  }
  // The drafts outside the ui, so a keystroke renders only its composer (review R28).
  const [ownDrafts] = useState(() => createDraftBook(stateUi.drafts))
  const drafts = pageDrafts ?? ownDrafts
  // The notice the owner dismissed; a new load gives a new notice, which shows again.
  const [dismissed, setDismissed] = useState<WorkspacesData['liveNotice']>()
  const shownNotice = data.liveNotice === dismissed ? undefined : data.liveNotice
  const liveNotice =
    shownNotice === undefined ? undefined : (
      <LiveNotice
        title={shownNotice.title}
        description={shownNotice.description}
        onDismiss={() => {
          setDismissed(shownNotice)
        }}
        onRetry={onRetry}
      />
    )
  // The line of a live edit that missed (R41, R42), under the notice.
  const editLine =
    edits?.line === undefined ? undefined : (
      <TranscriptProblem text={edits.line} action={{ label: 'Dismiss', onClick: edits.dismiss }} />
    )
  const notice =
    editLine === undefined ? (
      liveNotice
    ) : (
      <>
        {liveNotice}
        {editLine}
      </>
    )
  // The chat a command's dialog acts on (W5): the chat whose actions opened it, kept while the dialog is open.
  const target = data.panes.find((p) => p.id === (ui.commandFor ?? ui.focusedPane))
  const commandChat = target?.type === 'chat' ? target : undefined
  const commandDialog = (
    <ChatCommandDialog
      dialog={ui.chatDialog}
      chat={commandChat === undefined ? undefined : (ui.names?.[commandChat.id] ?? commandChat.head.title)}
      onOpenChange={(open) => {
        if (!open) change({ chatDialog: null, commandFor: null })
      }}
      onRun={commandChat === undefined || onCommand === undefined ? undefined : (r) => onCommand(commandChat.id, r)}
    />
  )
  // Close pane… of a live chat (W2): its dialog, for the chat in `ui.commandFor`, while that chat is still listed.
  const closing = ui.chatDialog === 'close' ? data.panes.find((p) => p.id === ui.commandFor) : undefined
  const closeDialog =
    layoutWrites === undefined || closing === undefined || closing.type === 'empty' ? null : (
      <CloseChatDialog
        key={closing.id}
        chat={ui.names?.[closing.id] ?? closing.head.title}
        closing={layoutWrites.pending.get(closing.id) === 'close'}
        onOpenChange={(open) => {
          if (!open) change({ chatDialog: null, commandFor: null })
        }}
        onClose={() => layoutWrites.close(closing.id)}
        onStop={
          closing.type === 'chat' && closing.liveChat !== undefined && onStop !== undefined
            ? () => onStop(closing.id)
            : undefined
        }
      />
    )
  // Move to tab… of a live chat (W2d): its dialog, for the chat in `ui.commandFor` and the tab in `ui.moveToTab`.
  const moving = ui.chatDialog === 'moveTab' ? data.panes.find((p) => p.id === ui.commandFor) : undefined
  const movingTabs = moving === undefined ? undefined : tabOf(data, moving.id)
  const toTab =
    movingTabs === undefined ? undefined : data.liveTabs?.[movingTabs.workspace]?.find((t) => t.id === ui.moveToTab)
  const nameOf = (id: string) => {
    const pane = data.panes.find((p) => p.id === id)
    return ui.names?.[id] ?? (pane === undefined || pane.type === 'empty' ? id : pane.head.title)
  }
  const closeMove = { chatDialog: null, commandFor: null, moveToTab: null }
  const moveDialog =
    layoutWrites === undefined || moving === undefined || toTab?.id === undefined ? null : (
      <MoveChatDialog
        key={`${moving.id} ${toTab.id}`}
        chat={nameOf(moving.id)}
        tab={toTab.label === undefined || toTab.label === '' ? 'the other tab' : toTab.label}
        panes={toTab.chats.map((id) => ({ id, title: nameOf(id) }))}
        onOpenChange={(open) => {
          if (!open) change(closeMove)
        }}
        onMove={({ beside, direction }) => {
          const tab = toTab.id
          if (tab === undefined) return
          // The workbench follows the open pane (the focused one) to its new tab.
          layoutWrites.move(moving.id, { tab, direction, beside }, ui.focusedPane === moving.id)
          change(closeMove)
        }}
      />
    )
  // Move to workspace of a live chat that is its workspace's last (backend #435): the move closes that workspace, so
  // the screen asks first, while the chat and the target are still listed.
  const ask = ui.moveAsk ?? undefined
  const askFrom = ask === undefined ? undefined : workspaceOf(data, ask.chat)
  const askTo = ask === undefined ? undefined : data.workspaces.find((w) => w.id === ask.workspace)
  const workspaceName = (w: { id: string; label: string }) => ui.workspaceNames?.[w.id] ?? w.label
  const moveAskDialog =
    edits === undefined || ask === undefined || askFrom === undefined || askTo === undefined ? null : (
      <MoveWorkspaceDialog
        key={`${ask.chat} ${ask.workspace}`}
        chat={nameOf(ask.chat)}
        to={workspaceName(askTo)}
        from={workspaceName(askFrom)}
        onOpenChange={(open) => {
          if (!open) change({ moveAsk: null })
        }}
        onMove={() => {
          edits.moveChat(ask.chat, ask.workspace)
          change({ moveAsk: null })
        }}
      />
    )
  // The ui lives here, above the layout, so a width change that swaps the layout keeps what the owner changed.
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => (
        <>
          <WorkspacesLayout
            layout={layout}
            data={data}
            ui={ui}
            viewport={viewport}
            onNavigate={onNavigate}
            navPages={navPages}
            onSend={onSend}
            onStop={onStop}
            filesOf={filesOf}
            pendingOf={pendingOf}
            effortOf={effortOf}
            transcripts={transcripts}
            skillLists={skillLists}
            onCopy={onCopy}
            change={change}
            drafts={drafts}
            notice={notice}
            layoutWrites={layoutWrites}
            newChat={newChat}
            edits={edits}
          />
          {phoneDeviceOf(layout, data) === undefined || data.phone === undefined ? (
            <DesktopNewChat data={data} ui={ui} change={change} newChat={newChat} />
          ) : null}
          {commandDialog}
          {closeDialog}
          {moveDialog}
          {moveAskDialog}
        </>
      )}
    </ViewportFrame>
  )
}

/** The device whose views the phone layout draws at `layout`: a phone, a tablet with `tabletList` (T1), else none. */
const phoneDeviceOf = (layout: Viewport, data: WorkspacesData) =>
  layout === 'phone' ? 'phone' : layout === 'tablet' && data.tabletList === true ? 'tablet' : undefined

type DesktopNewChatProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  change: (next: Partial<WorkspacesUi>) => void
  newChat: NewChatStarter | undefined
}

/**
 * The desktop's New chat form (D3) over either layout, the sidebar's or the workbench's. Each opening mounts it again
 * (`key`), so a live form starts empty.
 */
function DesktopNewChat({ data, ui, change, newChat }: DesktopNewChatProps) {
  if (data.newChat === undefined) return null
  return (
    <NewChatDialog
      key={ui.newChatOpen === true ? 'open' : 'closed'}
      // The workspace New chat was picked for (M14, M15) stays chosen when the window widens past a phone's.
      form={{ ...data.newChat, workspace: ui.newChatWorkspace ?? data.newChat.workspace }}
      workspaces={data.workspaces}
      open={ui.newChatOpen === true}
      onOpenChange={(open) => {
        change(open ? { newChatOpen: true } : { newChatOpen: false, newChatStart: null, newChatBeside: null })
      }}
      start={startOf(newChat, data, ui)}
    />
  )
}

type WorkspacesLayoutProps = Omit<WorkspacesScreenProps, 'onUiChange' | 'onRetry'> & {
  layout: Viewport
  change: (next: Partial<WorkspacesUi>) => void
  /** The composer drafts by chat (draftBook.ts). */
  drafts: DraftBook
  /** The live-unavailable notice that the layout draws at the top of its content, or none. */
  notice: ReactNode
}

function WorkspacesLayout({
  layout,
  data,
  ui,
  viewport,
  onNavigate,
  navPages = defaultVisiblePages,
  onSend,
  onStop,
  filesOf,
  pendingOf,
  effortOf,
  transcripts,
  skillLists,
  onCopy,
  change,
  drafts,
  notice,
  layoutWrites,
  newChat,
  edits,
}: WorkspacesLayoutProps) {
  // The names the owner gave chats (D21) take the place of their titles: in the sidebar, in the header of the chat
  // alone and in the panes of the workbench, with or without the sidebar.
  const names = ui.names ?? {}
  // The names the owner gave workspaces in the phone's edit mode (M2) take the place of their labels.
  const workspaceNames = ui.workspaceNames ?? {}
  // The workspaces the owner added with the phone's New workspace (M15) follow the others, with no chats yet.
  const added = (ui.addedWorkspaces ?? []).map((w) => ({ ...w, count: 0, needsYou: false, chats: [] }))
  // The workspaces the owner closed with the phone's close dialog (M13) leave both layouts, so a wider window keeps them
  // closed.
  const closed = ui.closedWorkspaces ?? []
  const workspaces = [...data.workspaces, ...added]
    .filter((w) => !closed.includes(w.id))
    .map((w) => {
      const label = workspaceNames[w.id] ?? w.label
      return w.chats === undefined
        ? { ...w, label }
        : { ...w, label, chats: w.chats.map((c) => ({ ...c, title: names[c.id] ?? c.title })) }
    })
  const panes = data.panes.map((p) =>
    p.type === 'chat' ? { ...p, head: { ...p.head, title: names[p.id] ?? p.head.title } } : p,
  )
  const named = { ...data, workspaces, panes }
  // T1: a state with `tabletList` draws the phone's views at a tablet's width too, with the tablet's tab bar.
  const phoneDevice = phoneDeviceOf(layout, data)
  if (phoneDevice !== undefined && data.phone !== undefined)
    return (
      <WorkspacesPhone
        device={phoneDevice}
        data={named}
        text={data.phone}
        ui={ui}
        onNavigate={onNavigate}
        navPages={navPages}
        onUiChange={change}
        drafts={drafts}
        onSend={onSend}
        onStop={onStop}
        filesOf={filesOf}
        pendingOf={pendingOf}
        effortOf={effortOf}
        transcripts={transcripts}
        skillLists={skillLists}
        onCopy={onCopy}
        notice={notice}
        layoutWrites={layoutWrites}
        newChat={newChat}
        edits={edits}
      />
    )
  // The shown workspace (R6): a tab the owner picked shows its own panes, so the focused chat, the chats the sidebar can
  // open and the chat actions' targets come from its panes, not the state's.
  const shown = shownView(named, ui).data
  // A live chat's Move to workspace (backend #435): it moves, or the screen asks first when it is its workspace's last.
  const moveChat =
    edits === undefined
      ? undefined
      : (chat: string, workspace: string) => {
          change(moveOrAsk(data, edits, chat, workspace))
        }
  const current = workspaces.find((w) => w.id === shown.current)
  const rail = (
    <div data-figma="nav rail" className={railSlot}>
      <AppRail
        selected="workspaces"
        pages={navLayout(navPages, 'desktop').rail}
        inboxBadge={data.railBadge}
        onSelect={onNavigate}
      />
    </div>
  )
  // The focused pane when it is a chat: only a chat can show alone. Beside the workbench any pane can be focused.
  const focused = shown.panes.find((p) => p.id === ui.focusedPane)
  const chat = focused?.type === 'chat' ? focused : undefined
  // With no workspace (an empty or failed live read, d-117) the sidebar still shows, with the notice at its top: the
  // workbench's tabs have no workspace to draw it in.
  const empty = workspaces.length === 0
  if (ui.sidebar === true && data.sidebar !== undefined && (ui.workbench === true || chat !== undefined || empty)) {
    const menuOpen = ui.menuFor === chat?.id
    const chatMenu =
      data.chatMenu === undefined || chat === undefined ? undefined : (
        <ChatActionsMenu
          title={chat.head.title}
          actions={withCommands(
            withLayoutActions(data.chatMenu, data, layoutWrites === undefined ? undefined : chat.id, 'desktopChat'),
            chat,
            data.chatCommands,
          )}
          targets={workspaces.filter((w) => w.id !== shown.current)}
          newWorkspace={data.newWorkspace}
          onMove={
            moveChat === undefined
              ? undefined
              : (workspace) => {
                  moveChat(chat.id, workspace)
                }
          }
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
          onSelect={(action) => {
            // D2b: New chat opens D3 in the chat's workspace; a live chat starts beside this one (W3).
            if (action === 'newChat' && data.newChat !== undefined)
              change({
                menuFor: null,
                moveOpen: false,
                newChatOpen: true,
                newChatWorkspace: shown.current,
                newChatBeside: chat.id,
                newChatStart: null,
              })
            if (action === 'rename') change({ menuFor: null, moveOpen: false, renaming: true })
            if (isChatCommand(action))
              change({ menuFor: null, moveOpen: false, chatDialog: action, commandFor: chat.id })
            if (action === 'focus' && layoutWrites !== undefined) {
              change({ menuFor: null, moveOpen: false })
              layoutWrites.focus(chat.id)
            }
            if (action === 'close' && layoutWrites !== undefined && tabOf(data, chat.id) !== undefined)
              change({ menuFor: null, moveOpen: false, chatDialog: 'close', commandFor: chat.id })
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
          onCopy={onCopy}
          onClose={() => {
            change({ sideChatOpen: false })
          }}
        />
      ) : undefined
    const dragged = workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === ui.paneDrag?.chat)
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
    const rename =
      ui.renaming === true && chat !== undefined ? (
        <ChatNameField
          name={chat.head.title}
          onSave={(name) => {
            // Live, the name goes to the server and shows from the next list read, never from `ui`.
            if (edits === undefined) change({ renaming: false, names: { ...names, [chat.id]: name } })
            else {
              edits.renameChat(chat.id, name, chat.head.title)
              change({ renaming: false })
            }
          }}
          onCancel={() => {
            change({ renaming: false })
          }}
          figma={data.layers?.renameField}
        />
      ) : undefined
    const toast =
      ui.toastOpen === true && data.toast !== undefined ? (
        <ChatToast
          text={data.toast.text}
          action={data.toast.action}
          onAction={() => {
            change({ toastOpen: false })
          }}
          figma={data.layers?.toast}
        />
      ) : undefined
    // The side slot gets a boundary only when it shows something: an empty slot draws no side column.
    const sideSlot = subagents ?? folderPicker ?? sideChat
    const sideKey = `${subagents === undefined ? (folderPicker === undefined ? 'sideChat' : 'folders') : 'subagents'}:${chat?.id ?? ''}`
    return (
      <Backdrop size={viewport}>
        <AppShell
          onDiagnostic={reportShellDiagnostic}
          size="desktop"
          listWidth="sidebar"
          rail={rail}
          list={
            <SlotBoundary contentKey="sidebar">
              <WorkspaceSidebar
                text={data.sidebar}
                workspaces={workspaces}
                selected={ui.focusedPane}
                openable={openableChats(named, ui)}
                onSelect={(picked) => {
                  change(openChat(named, ui, picked))
                }}
                ui={ui}
                onUiChange={change}
                layers={data.layers}
                notice={notice}
              />
            </SlotBoundary>
          }
          detail={
            ui.workbench === true || chat === undefined ? (
              <SlotBoundary contentKey="workbench">
                <WorkspaceTabs
                  data={named}
                  ui={ui}
                  onUiChange={change}
                  drafts={drafts}
                  toggle={false}
                  onSend={onSend}
                  onStop={onStop}
                  filesOf={filesOf}
                  pendingOf={pendingOf}
                  transcripts={transcripts}
                  skillLists={skillLists}
                  onCopy={onCopy}
                  layout={layoutWrites}
                  onMoveChat={moveChat}
                />
              </SlotBoundary>
            ) : (
              <SlotBoundary contentKey={chat.id}>
                <MainChat
                  pane={chat}
                  workspace={current?.label ?? shown.current ?? ''}
                  contextLabel={data.sidebar.contextLabel}
                  skills={{
                    label: data.skillsLabel,
                    matching: data.skillsMatching,
                    items: data.skills,
                    value: ui.skill,
                    open: ui.skillsFor === chat.id,
                    live: liveSkillList(skillLists, chat, change),
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
                  drafts={drafts}
                  onSend={
                    onSend &&
                    ((text) => {
                      // A Send focuses the live chat in herdr first, as a tap on its header does (W2).
                      layoutWrites?.focus(chat.id)
                      return onSend(chat.id, text)
                    })
                  }
                  onStop={onStop && (() => onStop(chat.id))}
                  files={filesOf?.(chat.id)}
                  pending={pendingOf?.(chat.id)}
                  effort={effortOf?.(chat.id)}
                  transcripts={transcripts}
                  onCopy={onCopy}
                  onHeaderTap={
                    layoutWrites === undefined
                      ? undefined
                      : () => {
                          layoutWrites.focus(chat.id)
                        }
                  }
                  rename={rename}
                  above={toast}
                  overlay={dropZone}
                />
              </SlotBoundary>
            )
          }
          sideWidth={subagents === undefined ? 'side' : 'wide'}
          side={sideSlot === undefined ? undefined : <SlotBoundary contentKey={sideKey}>{sideSlot}</SlotBoundary>}
        />
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
      <AppShell
        onDiagnostic={reportShellDiagnostic}
        size="desktop"
        rail={rail}
        detail={
          <SlotBoundary contentKey="workbench">
            <WorkspaceTabs
              data={named}
              ui={ui}
              onUiChange={change}
              drafts={drafts}
              toggle
              onSend={onSend}
              onStop={onStop}
              filesOf={filesOf}
              pendingOf={pendingOf}
              transcripts={transcripts}
              skillLists={skillLists}
              onCopy={onCopy}
              notice={notice}
              layout={layoutWrites}
              onMoveChat={moveChat}
            />
          </SlotBoundary>
        }
      />
    </Backdrop>
  )
}
