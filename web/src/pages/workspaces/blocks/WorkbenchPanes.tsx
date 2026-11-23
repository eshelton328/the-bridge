// The current workspace's panes in the split, clockwise from the top left
// (D1 105:174): each chat or shell in a `PaneFrame` with its menu, and an
// empty pane as it is. An open side chat shows inside the pane it belongs
// to (D5), and a chat dragged from the sidebar over a pane shows the drop
// zone over the part of the pane where it would open (D8). With `data.split`
// `rows` the split is rows first (D14), and a dragged handle shows its
// readout over the pane before it; with `stack` the panes are one above the
// other. Each handle's sizes are in `ui.splitSizes`.
// The empty pane's Close pane reports the pane closed (`onClosePane`).
// A chat's composer starts from the owner's draft (`drafts`, draftBook.ts) and sets
// it as he types, so the draft outlives the pane: a page visit, a closed pane. Its
// Send goes to `onSend` with the chat's id. A live Claude chat's pane menu ends
// with /compact and /clear (W5), which open their dialog for that chat.
// A live chat's pane (W2, layoutActions.ts) adds Zoom pane or Unzoom pane,
// Swap with… (the other chats of its herdr tab) and Close pane…, which opens
// the close dialog; Maximise zooms, a tap on its header and a Send in it
// focus the chat in herdr (`layout`). The panes move only when the new
// layout comes. Split right and Split down (W2c) put a new shell pane
// beside the chat or below it; with `onResize` (a live split) a dragged
// handle's sizes go there, not to the ui. Move to tab… (W2d) lists the
// workspace's other herdr tabs; a pick opens its dialog (`ui.chatDialog`
// `moveTab`, for the chat in `ui.commandFor` and the tab in `ui.moveToTab`).
// Props only; `ui` says which pane is focused and which menu,
// skill list or side chat is open.
import { SplitPanes } from '@eshelton328/component-library-1701'
import type { ChatWidth } from '../../../lib/deviceSettings.ts'
import type { ResizePart, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
import type { SkillLists } from './skillLists.ts'
import { liveSkillList } from './useSkillRows.ts'
import { isChatCommand, withCommands } from './chatCommands.ts'
import { type LayoutWrites, moveTargets, swapTargets, tabOf, withLayoutActions } from './layoutActions.ts'
import { ChatPane, type ChatFiles, type ChatPending, type TranscriptWatch } from './ChatPane.tsx'
import type { DraftBook } from './draftBook.ts'
import { EmptyPane } from './EmptyPane.tsx'
import { PaneDropZone } from './PaneDropZone.tsx'
import { PaneFrame } from './PaneFrame.tsx'
import { PaneMenu } from './PaneMenu.tsx'
import { ResizeReadout } from './ResizeReadout.tsx'
import { RowsSplit } from './RowsSplit.tsx'
import type { SplitPart } from './splitRatio.ts'
import { ShellPane } from './ShellPane.tsx'
import { SideChatPanel } from './SideChatPanel.tsx'
import type { ComposerAnswer } from './useComposerActions.ts'

// D1's Figma layers of the panes by their place in the split, and of the chats' composers and entries; a state's
// `layers` replace them.
const paneLayers = ['105:177', '105:262', '105:347', '105:316']
const chatLayers = [
  { composer: '105:230', entries: ['105:210', undefined, '105:215'] },
  { composer: '105:304', entries: [undefined, '105:291'] },
]

// The pane before each handle of a rows-first split, by its place in `panes`, and where its readout sits.
const readoutPane: Record<ResizePart, { place: number; placement: 'end' | 'bottom' }> = {
  rows: { place: 0, placement: 'bottom' },
  top: { place: 0, placement: 'end' },
  bottom: { place: 3, placement: 'end' },
}

// The layout actions that are off while a write of their pane waits (W2).
const layoutValues = new Set(['focus', 'zoom', 'unzoom', 'swap', 'close', 'splitRight', 'splitDown', 'moveTab'])

export type WorkbenchPanesProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** Called with a pane's id when the owner closes it with the empty pane's Close pane (D13). */
  onClosePane?: ((pane: string) => void) | undefined
  /** The page's drafts by chat (draftBook.ts): the composer starts from its chat's draft and sets it as the owner types. */
  drafts?: DraftBook | undefined
  /** Sends a chat's message; resolves `false` when the send failed, and the composer keeps the draft (ChatPane). */
  onSend?: ((chat: string, text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops a chat: its running composer's Stop (ChatPane `onStop`). */
  onStop?: ((chat: string) => Promise<ComposerAnswer>) | undefined
  /** A live Claude chat's files (W1b), by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `files`). */
  filesOf?: ((chat: string) => ChatFiles | undefined) | undefined
  /** A live Claude chat's pending send, by chat id; none for a sample chat, a Codex chat or a shell (ChatPane `pending`). */
  pendingOf?: ((chat: string) => ChatPending | undefined) | undefined
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** How wide the chat draws on the tablet and the desktop (Settings → Appearance); full when not set. */
  chatWidth?: ChatWidth | undefined
  /** Reads each live Claude chat's "/" list each time it opens (review R34); fixtures have none. */
  skillLists?: SkillLists | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /** The live chats' layout writes (W2); none on a fixture. */
  layout?: LayoutWrites | undefined
  /**
   * Takes a dragged handle's sizes in place of `onUiChange` (a live split, W2c, useRatioDrag.ts), with the sizes a stack
   * drew before them.
   */
  onResize?: ((part: SplitPart, sizes: number[], drawn?: readonly number[]) => void) | undefined
  /** Moves a live chat to another workspace, or asks first (backend #435, moveToWorkspace.ts); none on a fixture. */
  onMoveChat?: ((chat: string, workspace: string) => void) | undefined
  /** Forks a live Claude chat beside it (backend #443); none on a fixture. */
  onForkChat?: ((chat: string) => void) | undefined
}

export function WorkbenchPanes({
  data,
  ui,
  onUiChange,
  onClosePane,
  drafts,
  onSend,
  onStop,
  filesOf,
  pendingOf,
  transcripts,
  chatWidth,
  skillLists,
  onCopy,
  layout,
  onResize,
  onMoveChat,
  onForkChat,
}: WorkbenchPanesProps) {
  const targets = data.workspaces.filter((w) => w.id !== data.current)
  const panes = data.layers?.panes ?? paneLayers
  const chatsLayers = data.layers?.paneChats ?? chatLayers
  const side = ui.sideChatOpen === true ? data.sideChat : undefined
  const drag = ui.paneDrag
  const dragged = data.workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === drag?.chat)
  const resize = data.split === 'rows' ? (ui.resize ?? undefined) : undefined
  // Each handle keeps its own sizes; the dragged one's are the latest.
  const sizes = resize === undefined ? ui.splitSizes : { ...ui.splitSizes, [resize.part]: resize.sizes }
  const readout =
    resize !== undefined && data.resizeHint !== undefined
      ? {
          ...readoutPane[resize.part],
          label: data.resizeHint.replace('{ratio}', resize.sizes.map((s) => Math.round(s)).join(' : ')),
        }
      : undefined
  let chats = 0
  // The name of a chat Swap with… lists: its sidebar row's, which carries the owner's names.
  const titleOf = (id: string) => data.workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === id)?.title ?? id
  const render = (pane: WorkbenchPane, place: number) => {
    if (pane.type === 'empty')
      return (
        <EmptyPane
          {...pane}
          onClose={() => onClosePane?.(pane.id)}
          figma={{ pane: data.layers?.panes?.[place], rows: data.layers?.emptyRows, close: data.layers?.emptyClose }}
        />
      )
    // A live chat's layout writes (W2): only for a chat in a herdr tab the page read, and off while one is pending.
    const tab = layout === undefined ? undefined : tabOf(data, pane.id)?.tab
    const pending = layout?.pending.get(pane.id)
    const live = layout !== undefined && tab !== undefined ? layout : undefined
    const actions = withLayoutActions(data.paneMenu, data, live === undefined ? undefined : pane.id, 'pane').map((a) =>
      pending !== undefined && layoutValues.has(a.value) ? { ...a, disabled: true } : a,
    )
    const menu = (
      <PaneMenu
        title={pane.head.title}
        actions={withCommands(actions, pane, data.chatCommands)}
        swapTargets={
          live === undefined ? undefined : swapTargets(data, pane.id).map((id) => ({ id, title: titleOf(id) }))
        }
        onSwap={
          live === undefined
            ? undefined
            : (other) => {
                onUiChange?.({ menuFor: null, moveOpen: false })
                live.swap(pane.id, other)
              }
        }
        moveTabs={live === undefined ? undefined : moveTargets(data, pane.id)}
        onMoveTab={
          live === undefined
            ? undefined
            : (moveToTab) => {
                onUiChange?.({ menuFor: null, moveOpen: false, chatDialog: 'moveTab', commandFor: pane.id, moveToTab })
              }
        }
        targets={targets}
        newWorkspace={data.newWorkspace}
        onMove={
          onMoveChat === undefined
            ? undefined
            : (workspace) => {
                onMoveChat(pane.id, workspace)
              }
        }
        open={ui.menuFor === pane.id}
        onOpenChange={(open) => onUiChange?.({ menuFor: open ? pane.id : null, moveOpen: false })}
        moveOpen={ui.menuFor === pane.id && ui.moveOpen}
        onMoveOpenChange={(open) => onUiChange?.({ moveOpen: open })}
        highlighted={ui.menuHighlight}
        onHighlightChange={(menuHighlight) => onUiChange?.({ menuHighlight })}
        moveTarget={ui.moveTarget}
        onMoveTargetChange={(moveTarget) => onUiChange?.({ moveTarget })}
        onSelect={(action) => {
          // D2b: a pane's menu holds the chat actions; a live chat's New chat starts beside it (W3). It needs no layout
          // write, so it opens the form also while the workspace's layout read fails.
          if (action === 'newChat' && data.newChat !== undefined)
            onUiChange?.({
              menuFor: null,
              moveOpen: false,
              newChatOpen: true,
              newChatWorkspace: tabOf(data, pane.id)?.workspace ?? data.current,
              newChatBeside: pane.id,
              newChatStart: null,
            })
          // A live Claude chat's Fork starts its copy beside it (backend #443); it needs no layout write either.
          if (action === 'fork' && onForkChat !== undefined) {
            onUiChange?.({ menuFor: null, moveOpen: false })
            onForkChat(pane.id)
          }
          if (live !== undefined && (action === 'zoom' || action === 'unzoom')) {
            onUiChange?.({ menuFor: null, moveOpen: false })
            live.zoom(pane.id, action === 'zoom')
          }
          if (live !== undefined && (action === 'splitRight' || action === 'splitDown')) {
            onUiChange?.({ menuFor: null, moveOpen: false })
            live.split(pane.id, action === 'splitRight' ? 'row' : 'column')
          }
          if (live !== undefined && action === 'focus') {
            onUiChange?.({ menuFor: null, moveOpen: false })
            live.focus(pane.id)
          }
          if (live !== undefined && action === 'close')
            onUiChange?.({ menuFor: null, moveOpen: false, chatDialog: 'close', commandFor: pane.id })
          // A command's dialog acts on the focused chat (W5): the pane whose menu picked it takes the focus.
          if (isChatCommand(action))
            onUiChange?.({
              menuFor: null,
              moveOpen: false,
              focusedPane: pane.id,
              chatDialog: action,
              commandFor: pane.id,
            })
        }}
      />
    )
    const layers = pane.type === 'chat' ? (chatsLayers[chats++] ?? { composer: pane.id }) : { composer: pane.id }
    return (
      <PaneFrame
        head={pane.head}
        figma={panes[place] ?? pane.id}
        focused={ui.focusedPane === pane.id}
        onActivate={() => onUiChange?.({ focusedPane: pane.id })}
        onHeaderTap={
          live === undefined
            ? undefined
            : () => {
                live.focus(pane.id)
              }
        }
        zoom={
          live === undefined || tab === undefined || tab.chats.length < 2
            ? undefined
            : {
                zoomed: tab.zoomed && tab.focused === pane.id,
                // Off while any write of this pane waits, as the page sends one write at a time for a chat.
                pending: pending !== undefined,
                onToggle: () => {
                  live.zoom(pane.id, !(tab.zoomed && tab.focused === pane.id))
                },
              }
        }
        menu={menu}
        overlay={
          drag?.pane === pane.id && dragged !== undefined && data.paneDrop !== undefined ? (
            <PaneDropZone
              edge={drag.edge}
              chat={dragged}
              target={pane.head.title}
              drop={data.paneDrop}
              placement="pane"
              figma={data.layers?.dropZone}
            />
          ) : readout?.place === place ? (
            <ResizeReadout label={readout.label} placement={readout.placement} figma={data.layers?.resizeHint} />
          ) : undefined
        }
      >
        {pane.type === 'chat' ? (
          <ChatPane
            // Each chat its own composer, whose text is its state: a pane that shows another chat starts from its draft.
            key={pane.id}
            chatId={pane.id}
            figma={layers}
            entries={pane.entries}
            notLive={pane.notLive}
            liveChat={pane.liveChat}
            transcripts={transcripts}
            chatWidth={chatWidth}
            onCopy={onCopy}
            earlier={pane.earlier}
            empty={pane.empty}
            problem={pane.problem}
            loading={pane.loading === undefined ? undefined : { label: pane.loading, kind: pane.head.kind }}
            composer={pane.composer}
            drafts={drafts}
            onSend={
              onSend &&
              ((text) => {
                // A Send in a live pane focuses it in herdr first, as a tap on its header does (W2).
                live?.focus(pane.id)
                return onSend(pane.id, text)
              })
            }
            onStop={onStop && (() => onStop(pane.id))}
            files={filesOf?.(pane.id)}
            pending={pendingOf?.(pane.id)}
            skills={{
              label: data.skillsLabel,
              matching: data.skillsMatching,
              items: data.skills,
              value: ui.skill,
              open: ui.skillsFor === pane.id,
              live: liveSkillList(skillLists, pane, onUiChange),
            }}
            onSkillsOpenChange={(open) => onUiChange?.({ skillsFor: open ? pane.id : null })}
            overlay={
              side?.pane === pane.id ? (
                <SideChatPanel
                  chat={side}
                  placement="pane"
                  layers={data.layers}
                  onCopy={onCopy}
                  onClose={() => onUiChange?.({ sideChatOpen: false })}
                />
              ) : undefined
            }
          />
        ) : (
          <ShellPane
            paneId={pane.id}
            label={pane.head.title}
            lines={pane.lines}
            prompt={pane.prompt}
            notLive={pane.notLive}
            figma={data.layers?.shell}
          />
        )}
      </PaneFrame>
    )
  }
  const shown = data.panes.map((pane, i) => ({ id: pane.id, content: render(pane, i) }))
  // A live split's handle goes to `onResize` (W2c); a sample's to the ui.
  const resized = (part: SplitPart, next: number[], change: Partial<WorkspacesUi>, drawn?: readonly number[]) => {
    if (onResize === undefined) onUiChange?.(change)
    else onResize(part, next, drawn)
  }
  if (data.split === 'stack')
    return (
      <RowsSplit
        stack
        panes={shown}
        sizes={ui.splitSizes}
        onSizeChange={(part, next, drawn) => {
          resized(part, next, { splitSizes: { ...ui.splitSizes, [part]: next } }, drawn)
        }}
      />
    )
  if (data.split === 'rows')
    return (
      <RowsSplit
        panes={shown}
        sizes={sizes}
        onSizeChange={(part, next) => {
          resized(part, next, { resize: { part, sizes: next }, splitSizes: { ...sizes, [part]: next } })
        }}
      />
    )
  return (
    <SplitPanes
      panes={shown}
      sizes={ui.splitSizes}
      onSizeChange={(part, next) => {
        resized(part, next, { splitSizes: { ...ui.splitSizes, [part]: next } })
      }}
    />
  )
}
