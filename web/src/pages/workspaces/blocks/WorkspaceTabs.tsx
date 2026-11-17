// The Workbench column (D1 105:105): the 52 px tab bar (`size="compact"`)
// with, without the sidebar, the button that shows it before the tabs, then
// the tabs and New chat, the current workspace's panes and the status bar.
// Beside the sidebar (D7 402:422) the toggle sits in the sidebar, so the tab
// bar has New chat alone. Props only.
import { Button, PanelIcon, PlusIcon, Workbench } from '@eshelton328/component-library-1701'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { WorkbenchPanes } from './WorkbenchPanes.tsx'

export type WorkspaceTabsProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** The tab bar has the button that shows the sidebar; not when the sidebar shows. */
  toggle: boolean
}

export function WorkspaceTabs({ data, ui, onUiChange, toggle }: WorkspaceTabsProps) {
  const current = data.workspaces.find((w) => w.id === data.current)
  return (
    <Workbench
      value={data.current}
      workspaces={data.workspaces.map((w) => ({
        value: w.id,
        label: w.label,
        count: w.count,
        needsYou: w.needsYou,
        draggable: true,
        content: w.id === data.current ? <WorkbenchPanes data={data} ui={ui} onUiChange={onUiChange} /> : null,
      }))}
      size="compact"
      leading={
        toggle ? (
          <Button
            size="sm"
            iconOnly
            aria-label="Show the workspace sidebar"
            data-figma={data.layers?.toggle ?? '158:2'}
          >
            <PanelIcon size="16" />
          </Button>
        ) : null
      }
      actions={
        <Button
          size="sm"
          iconOnly
          aria-label={`New chat in ${current?.label ?? data.current}`}
          data-figma={data.layers?.newChat ?? '150:2'}
        >
          <PlusIcon size="16" />
        </Button>
      }
      summary={data.status.summary}
      hints={data.status.hints}
      alert={data.status.alert}
    />
  )
}
