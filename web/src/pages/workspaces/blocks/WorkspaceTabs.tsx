// The Workbench column (D1 105:105): the 52 px tab bar (`size="compact"`)
// with, without the sidebar, the button that shows it before the tabs, then
// the tabs and New chat, the current workspace's panes and the status bar.
// Beside the sidebar (D7 402:422) the toggle sits in the sidebar, so the tab
// bar has New chat alone. A click on a tab shows that workspace as the owner left
// it, or its last chat alone in one pane (R6); each workspace keeps its own
// layout in `ui.layouts` (blocks/workspaceLayout.ts). Props only.
import { Button, PanelIcon, PlusIcon, Workbench } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
import type { TranscriptWatch } from './ChatPane.tsx'
import type { DraftBook } from './draftBook.ts'
import { WorkbenchPanes } from './WorkbenchPanes.tsx'
import { closeShownPane, resizeShown, shownView, shownWorkspace, switchTo } from './workspaceLayout.ts'
import type { ComposerAnswer } from './useComposerActions.ts'

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
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /**
   * The live-unavailable notice (LiveNotice), drawn over the shown workspace's panes; none when not set. Beside the
   * sidebar the sidebar draws it, so the page passes none.
   */
  notice?: ReactNode
}

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
  transcripts,
  onCopy,
  notice,
}: WorkspaceTabsProps) {
  const shown = shownWorkspace(data, ui)
  const current = data.workspaces.find((w) => w.id === shown)
  const view = shownView(data, ui)
  // A resize of the shown split goes to the shown workspace's layout; the rest of the change goes as it is.
  const report = (change: Partial<WorkspacesUi>) => {
    const { splitSizes, ...rest } = change
    onUiChange?.(splitSizes === undefined ? change : { ...rest, ...resizeShown(data, ui, splitSizes) })
  }
  const panes = (
    <WorkbenchPanes
      data={view.data}
      ui={view.ui}
      onUiChange={report}
      onClosePane={(pane) => onUiChange?.(closeShownPane(data, ui, pane))}
      drafts={drafts}
      onSend={onSend}
      onStop={onStop}
      transcripts={transcripts}
      onCopy={onCopy}
    />
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
        >
          <PlusIcon size="16" />
        </Button>
      }
      summary={view.data.status.summary}
      hints={data.status.hints}
      alert={data.status.alert}
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
