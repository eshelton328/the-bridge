// The Workbench column (D1 105:105): the 52 px tab bar (`size="compact"`)
// with, without the sidebar, the button that shows it before the tabs, then
// the tabs and New chat, the current workspace's panes and the status bar.
// Beside the sidebar (D7 402:422) the toggle sits in the sidebar, so the tab
// bar has New chat alone. A click on a tab shows that workspace as the owner left
// it, or its last chat alone in one pane (R6); each workspace keeps its own
// layout in `ui.layouts` (blocks/workspaceLayout.ts). A live chat's layout
// write that missed says so in the status bar's alert (W2). A dragged handle
// of a live split sends its ratio when the drag ends (W2c, useRatioDrag.ts).
// Props only.
import { Button, PanelIcon, PlusIcon, Workbench } from '@eshelton328/component-library-1701'
import type { ChatWidth } from '../../../lib/deviceSettings.ts'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
import type { ChatDialog } from './chatDialog.ts'
import type { ChatFiles, ChatPending, TranscriptWatch } from './ChatPane.tsx'
import type { DraftBook } from './draftBook.ts'
import type { LayoutWrites } from './layoutActions.ts'
import type { SkillLists } from './skillLists.ts'
import { WorkbenchPanes } from './WorkbenchPanes.tsx'
import { closeShownPane, resizeShown, shownView, shownWorkspace, switchTo } from './workspaceLayout.ts'
import type { ComposerAnswer } from './useComposerActions.ts'
import { useRatioDrag } from './useRatioDrag.ts'

export type WorkspaceTabsProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** The tab bar has the button that shows the sidebar; not when the sidebar shows. */
  toggle: boolean
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
  /** A live Claude chat's terminal dialog source, by chat id, read while the chat needs the owner (R69); none for a sample chat. */
  dialogOf?: ((chat: string) => ChatDialog | undefined) | undefined
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** How wide the chat draws on the tablet and the desktop (Settings → Appearance); full when not set. */
  chatWidth?: ChatWidth | undefined
  /** Reads each live Claude chat's "/" list each time it opens (review R34); fixtures have none. */
  skillLists?: SkillLists | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /**
   * The live-unavailable notice (LiveNotice), drawn over the shown workspace's panes; none when not set. Beside the
   * sidebar the sidebar draws it, so the page passes none.
   */
  notice?: ReactNode
  /** The live chats' layout writes (W2); none on a fixture. */
  layout?: LayoutWrites | undefined
  /** Moves a live chat to another workspace, or asks first (backend #435, moveToWorkspace.ts); none on a fixture. */
  onMoveChat?: ((chat: string, workspace: string) => void) | undefined
  /** Forks a live Claude chat beside it (backend #443); none on a fixture. */
  onForkChat?: ((chat: string) => void) | undefined
  /** Asks a live Claude chat's side question (useSideChats.ts), by chat id; none on a fixture. */
  onSideAsk?: ((chat: string, question: string) => Promise<ComposerAnswer>) | undefined
  /** Stops a live Claude chat's side answer (the side composer's Stop), by chat id; none on a fixture. */
  onSideStop?: ((chat: string) => Promise<ComposerAnswer>) | undefined
}

// The box that sees a press on a handle draws no box of its own: the panes lay out as they do without it.
const handlesBox = css({ display: 'contents' })
// With a notice: the notice over the panes, which take the height left.
const withNotice = css({ display: 'flex', flexDirection: 'column', gap: '8', flex: '1', minH: '[0]' })
const panesSlot = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export function WorkspaceTabs({
  data,
  ui,
  onUiChange,
  drafts,
  toggle,
  onSend,
  onStop,
  filesOf,
  pendingOf,
  dialogOf,
  transcripts,
  chatWidth,
  skillLists,
  onCopy,
  notice,
  layout,
  onMoveChat,
  onForkChat,
  onSideAsk,
  onSideStop,
}: WorkspaceTabsProps) {
  const shown = shownWorkspace(data, ui)
  const current = data.workspaces.find((w) => w.id === shown)
  // The workbench draws a zoomed tab's focused pane alone (W2).
  const view = shownView(data, ui, true)
  const drag = useRatioDrag(layout, data, view, shown)
  // A resize of the shown split goes to the shown workspace's layout; the rest of the change goes as it is.
  const report = (change: Partial<WorkspacesUi>) => {
    const { splitSizes, ...rest } = change
    onUiChange?.(splitSizes === undefined ? change : { ...rest, ...resizeShown(data, ui, splitSizes) })
  }
  const panes = (
    <div className={handlesBox} onPointerDownCapture={drag.onPointerDownCapture}>
      <WorkbenchPanes
        data={view.data}
        ui={drag.ui}
        onResize={drag.onResize}
        onUiChange={report}
        onClosePane={(pane) => onUiChange?.(closeShownPane(data, ui, pane))}
        drafts={drafts}
        onSend={onSend}
        onStop={onStop}
        filesOf={filesOf}
        pendingOf={pendingOf}
        dialogOf={dialogOf}
        transcripts={transcripts}
        chatWidth={chatWidth}
        skillLists={skillLists}
        onCopy={onCopy}
        layout={layout}
        onMoveChat={onMoveChat}
        onForkChat={onForkChat}
        onSideAsk={onSideAsk}
        onSideStop={onSideStop}
      />
    </div>
  )
  const workbench = (
    <Workbench
      // No workspace (an empty live list): no tab is selected.
      value={shown ?? undefined}
      onValueChange={(next) => {
        if (next !== shown) onUiChange?.(switchTo(data, ui, next))
      }}
      workspaces={data.workspaces.map((w) => ({
        value: w.id,
        label: w.label,
        count: w.count,
        needsYou: w.needsYou,
        draggable: true,
        content:
          w.id === shown ? (
            notice === undefined ? (
              panes
            ) : (
              <div className={withNotice}>
                {notice}
                <div className={panesSlot}>{panes}</div>
              </div>
            )
          ) : null,
      }))}
      size="compact"
      leading={
        toggle ? (
          <Button
            size="sm"
            iconOnly
            aria-label="Show the workspace sidebar"
            data-figma={data.layers?.toggle ?? '158:2'}
            onClick={() => onUiChange?.({ sidebar: true })}
          >
            <PanelIcon size="16" />
          </Button>
        ) : null
      }
      actions={
        <Button
          size="sm"
          iconOnly
          aria-label={shown === null ? 'New chat' : `New chat in ${current?.label ?? shown}`}
          data-figma={data.layers?.newChat ?? '150:2'}
          // D1: + starts a new chat in the shown workspace, as in herdr: a live one in a new tab (W3).
          onClick={
            data.newChat === undefined || shown === null
              ? undefined
              : () =>
                  onUiChange?.({
                    newChatOpen: true,
                    newChatWorkspace: shown,
                    newChatBeside: null,
                    newChatStart: null,
                  })
          }
        >
          <PlusIcon size="16" />
        </Button>
      }
      summary={view.data.status.summary}
      hints={data.status.hints}
      alert={layout?.line ?? data.status.alert}
    />
  )
  // No workspace (an empty or failed live read, d-117): no tab can hold the notice, so it sits over the workbench.
  if (data.workspaces.length > 0 || notice === undefined) return workbench
  return (
    <div className={withNotice}>
      {notice}
      <div className={panesSlot}>{workbench}</div>
    </div>
  )
}
