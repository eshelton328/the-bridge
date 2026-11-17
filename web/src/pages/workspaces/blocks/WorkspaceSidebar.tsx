// The workspace sidebar (D2 105:611): the Workspaces title with the button
// that hides the sidebar, + for a new workspace, then each workspace and its
// chats. Props only; `ui` says which groups are closed, which header the
// pointer rests on and which chat Erik drags onto which workspace.
import { Button, Panel, PanelIcon, PlusIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarText, Workspace, WorkspacesUi } from '../types.ts'
import { SidebarGroup } from './SidebarGroup.tsx'

// The list slot is a flex column; the sidebar fills it.
const slot = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type WorkspaceSidebarProps = {
  text: SidebarText
  workspaces: readonly Workspace[]
  /** The chat in the middle of the screen. */
  selected: string
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all)

export function WorkspaceSidebar({ text, workspaces, selected, ui, onUiChange }: WorkspaceSidebarProps) {
  const collapsed = ui.collapsed ?? []
  const dragged = workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === ui.drag?.chat)
  return (
    <div data-figma="105:611" className={slot}>
      <Panel
        variant="sidebar"
        title={text.title}
        meta={
          <Button
            size="sm"
            iconOnly
            pressed
            aria-label={text.hide}
            data-figma="158:6"
            onClick={() => onUiChange?.({ sidebar: false })}
          >
            <PanelIcon size="16" />
          </Button>
        }
        actions={
          <Button size="sm" aria-label={text.newWorkspace} data-figma="105:617">
            <PlusIcon size="16" />
          </Button>
        }
      >
        <Stack gap="4">
          {workspaces.map((w) => (
            <SidebarGroup
              key={w.id}
              workspace={w}
              open={!collapsed.includes(w.id)}
              onOpenChange={(open) =>
                onUiChange?.({ collapsed: open ? collapsed.filter((id) => id !== w.id) : [...collapsed, w.id] })
              }
              hovered={ui.hovered === w.id}
              selected={selected}
              onSelect={(chat) => onUiChange?.({ focusedPane: chat })}
              drop={
                dragged !== undefined && ui.drag?.over === w.id
                  ? { chat: dragged, hint: fill(text.dropHint, { chat: dragged.title, workspace: w.label }) }
                  : undefined
              }
            />
          ))}
        </Stack>
      </Panel>
    </div>
  )
}
