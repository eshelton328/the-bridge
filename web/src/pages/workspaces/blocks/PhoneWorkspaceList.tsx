// The phone's home of the Workspaces page (M1 105:2327): the large title
// with Edit and +, then every workspace with its chats, as the desktop
// sidebar lists them (SidebarGroup), each chat row with its ⋯ after the
// status. A tap on a row with a chat to show selects it; a workspace's
// chevron shows or hides its chats. Props only.
import { Button, Container, MoreIcon, PageHeader, PlusIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { PhoneText, SidebarLayers, Workspace, WorkspacesUi } from '../types.ts'
import { SidebarGroup } from './SidebarGroup.tsx'

// The list fills the screen above the tab bar (M1 105:2327, 38 to 767).
const fill = css({ flex: '1' })
// M1 105:2329: the large title sits 4 in from the header's edge, over the group chevrons, and Edit and + end 4 in.
// Figma's header is 44 high (105:2328) where `PageHeader size="phone"` is 40, so it pads 4 under the title.
const header = css({ px: '4', pb: '4' })
// A text button draws its icon in the accent colour; Figma draws the row's ⋯ in grey (M1 146:3). Figma's ⋯ ends 2 in
// from the row's edge, where `ListRow` pads 10 inside its border, so the button reaches 8 into that padding and the
// status moves with it. The button is 36 high in a 52 px row, as in Figma (146:2), so it reaches 4 into the padding
// above and below too, and the row keeps the height of its two lines (LIBRARY_GAPS.md: Phone chat row).
const rowMenu = css({ color: 'fg.muted', me: '-8', my: '-4' })

export type PhoneWorkspaceListProps = {
  text: PhoneText
  workspaces: readonly Workspace[]
  /** The chat drawn selected: the one shown last. */
  selected: string
  /** The chats with a pane to show; the other rows cannot be selected. */
  openable: readonly string[]
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
}

export function PhoneWorkspaceList({
  text,
  workspaces,
  selected,
  openable,
  ui,
  onUiChange,
  layers,
}: PhoneWorkspaceListProps) {
  const collapsed = ui.collapsed ?? []
  return (
    <Container size="phone" gap="4" className={fill} data-figma={layers?.phoneList}>
      <div className={header} data-figma={layers?.phoneHeader}>
        <PageHeader size="phone" title={text.title}>
          <Button size="sm" data-figma={layers?.phoneEdit}>
            {text.edit}
          </Button>
          {/* M1 105:2335: + is 36 wide and 28 high, so not a square icon button. */}
          <Button size="sm" aria-label={text.add} data-figma={layers?.phoneAdd}>
            <PlusIcon size="16" />
          </Button>
        </PageHeader>
      </div>
      {workspaces.map((w) => (
        <SidebarGroup
          key={w.id}
          workspace={w}
          open={!collapsed.includes(w.id)}
          onOpenChange={(open) =>
            onUiChange?.({ collapsed: open ? collapsed.filter((id) => id !== w.id) : [...collapsed, w.id] })
          }
          hovered={false}
          selected={selected}
          openable={openable}
          layers={layers}
          grip={false}
          onSelect={(chat) => onUiChange?.({ focusedPane: chat })}
          rowMenu={(chat) => (
            <Button
              variant="text"
              size="lg"
              iconOnly
              className={rowMenu}
              aria-label={`${chat.title} actions`}
              data-figma={layers?.rowMenus?.[chat.id]}
            >
              <MoreIcon size="20" />
            </Button>
          )}
        />
      ))}
    </Container>
  )
}
