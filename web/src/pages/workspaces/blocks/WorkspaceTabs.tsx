// The Workbench column (D1 105:105): the 52 px tab bar (`size="compact"`)
// with, without the sidebar, the button that shows it before the tabs, then
// the tabs and New chat, the current workspace's panes and the status bar.
// Beside the sidebar (D7 402:422) the toggle sits in the sidebar, so the tab
// bar has New chat alone. A click on a tab shows that workspace as Erik left
// it, or its last chat alone in one pane (R6); each workspace keeps its own
// layout in `ui.layouts` (blocks/workspaceLayout.ts). Props only.
import { Button, PanelIcon, PlusIcon, Workbench } from '@eshelton328/component-library-1701'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { WorkbenchPanes } from './WorkbenchPanes.tsx'
import { closeShownPane, resizeShown, shownView, shownWorkspace, switchTo } from './workspaceLayout.ts'

export type WorkspaceTabsProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** The tab bar has the button that shows the sidebar; not when the sidebar shows. */
  toggle: boolean
}

export function WorkspaceTabs({ data, ui, onUiChange, toggle }: WorkspaceTabsProps) {
  const shown = shownWorkspace(data, ui)
  const current = data.workspaces.find((w) => w.id === shown)
  const view = shownView(data, ui)
  // A resize of the shown split goes to the shown workspace's layout; the rest of the change goes as it is.
  const report = (change: Partial<WorkspacesUi>) => {
    const { splitSizes, ...rest } = change
    onUiChange?.(splitSizes === undefined ? change : { ...rest, ...resizeShown(data, ui, splitSizes) })
  }
  return (
    <Workbench
      value={shown}
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
            <WorkbenchPanes
              data={view.data}
              ui={view.ui}
              onUiChange={report}
              onClosePane={(pane) => onUiChange?.(closeShownPane(data, ui, pane))}
            />
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
          aria-label={`New chat in ${current?.label ?? shown}`}
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
}
