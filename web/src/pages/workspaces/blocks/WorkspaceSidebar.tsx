// The workspace sidebar (D2 105:611): the Workspaces title with the button
// that hides the sidebar, + for a new workspace, then each workspace and its
// chats. Only a chat with a pane to show can be selected. Props only; `ui`
// says which groups are closed, which header the pointer rests on and which
// chat Erik drags onto which workspace.
import { Button, Panel, PanelIcon, PlusIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, SidebarText, Workspace, WorkspacesUi } from '../types.ts'
import { SidebarGroup } from './SidebarGroup.tsx'

// The list slot is a flex column; the sidebar fills it.
const slot = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type WorkspaceSidebarProps = {
  text: SidebarText
  workspaces: readonly Workspace[]
  /** The chat in the middle of the screen. */
  selected: string
  /** The chats with a pane to show; the other rows cannot be selected. */
  openable: readonly string[]
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all)

export function WorkspaceSidebar({
  text,
  workspaces,
  selected,
  openable,
  ui,
  onUiChange,
  layers,
}: WorkspaceSidebarProps) {
  const collapsed = ui.collapsed ?? []
  const dragged = workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === ui.drag?.chat)
  return (
    <div data-figma={layers?.sidebar ?? '105:611'} className={slot}>
      <Panel
        variant="sidebar"
        title={text.title}
        meta={
          <Button
            size="sm"
            iconOnly
            pressed
            // Figma draws the open toggle's border #5ee1ff at about 0.6 (D2 158:6), an alpha no token has; it snaps
            // to the nearest token, border.selected, not the pressed border.active.
            pressedBorder="selected"
            aria-label={text.hide}
            data-figma={layers?.toggle ?? '158:6'}
            onClick={() => onUiChange?.({ sidebar: false })}
          >
            <PanelIcon size="16" />
          </Button>
        }
        actions={
          <Button size="sm" aria-label={text.newWorkspace} data-figma={layers?.newWorkspace ?? '105:617'}>
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
              openable={openable}
              layers={layers}
              counts={text.counts}
              grip={text.grip}
              moving={ui.paneDrag?.chat}
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
