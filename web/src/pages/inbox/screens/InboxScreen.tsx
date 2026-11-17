// The Inbox page as one props-only screen, laid out by the width it gets
// (ViewportFrame): on the desktop, the rail, the list pane and the open
// item side by side; on the tablet and phone, the list or the open item
// full width, with Back on the item and the tab bar under both, except in a
// chat (Figma T1 to T8). A state file's data and ui are its props; the
// callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import { RemoveDialog } from '../blocks/RemoveDialog.tsx'
import {
  type InboxDraftField,
  type InboxDrafts,
  type InboxData,
  type InboxGroupId,
  type InboxProposal,
  type InboxUi,
} from '../types.ts'
import { InboxDetail } from './InboxDetail.tsx'
import { InboxListPane } from './InboxListPane.tsx'

export type InboxScreenProps = {
  data: InboxData
  ui: InboxUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
  /** Back on a tablet or phone: closes the open item and shows the list. */
  onBack?: (() => void) | undefined
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** The text Erik typed in the search field; without it the field shows the state's query. */
  query?: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  onRemoveOpenChange?: ((open: boolean) => void) | undefined
}

/** The removal the discussion proposes, if any: the confirm dialog's content. */
function removal(data: InboxData): Extract<InboxProposal, { kind: 'remove' }> | undefined {
  for (const entry of data.discussion?.entries ?? [])
    if (entry.type === 'proposal' && entry.proposal.kind === 'remove') return entry.proposal
  return undefined
}

type InboxLayoutProps = Omit<InboxScreenProps, 'viewport'> & { layout: Viewport; drafts: InboxDrafts }

function InboxLayout({ layout, drafts, ...props }: InboxLayoutProps) {
  const { data, ui, onNavigate, onSelectItem, onBack, onPromptOpenChange, onRemoveOpenChange } = props
  const { discussion } = data
  const desktop = layout === 'desktop'
  const discussing = desktop && discussion !== undefined && ui.discussOpen
  const remove = removal(data)
  const open = ui.selectedId === null ? null : data.detail
  // Only a chat hides the tab bar (T1 note): the started item's chat fills the screen down to its reply box.
  const inChat = open?.kind === 'running'
  const list = (
    <InboxListPane
      data={data}
      ui={ui}
      layout={layout}
      onFilterChange={props.onFilterChange}
      onGroupOpenChange={props.onGroupOpenChange}
      onSelectItem={onSelectItem}
      query={props.query}
      onQueryChange={props.onQueryChange}
    />
  )
  // The desktop always shows the state's item; the tablet and phone only the one Erik opened.
  const shown = desktop ? data.detail : open
  const detail =
    shown === null ? undefined : (
      <InboxDetail
        detail={shown}
        ui={ui}
        layout={layout}
        onBack={onBack}
        drafts={drafts}
        onPromptOpenChange={onPromptOpenChange}
        discuss={discussion === undefined ? undefined : { open: discussing }}
        side={
          discussing ? (
            <DiscussionPanel
              discussion={discussion}
              onRemove={() => {
                onRemoveOpenChange?.(true)
              }}
            />
          ) : undefined
        }
      />
    )
  return (
    <Backdrop size={layout}>
      <AppShell
        size={layout}
        view={open === null ? 'list' : 'detail'}
        rail={desktop ? <AppRail selected="inbox" inboxBadge={data.railBadge} onSelect={onNavigate} /> : undefined}
        tabBar={
          desktop || inChat ? undefined : (
            <AppTabBar selected="inbox" inboxBadge={data.railBadge} onSelect={onNavigate} />
          )
        }
        list={discussing ? undefined : list}
        detail={detail}
      />
      {remove === undefined ? null : (
        <RemoveDialog proposal={remove} open={ui.removeOpen} onOpenChange={onRemoveOpenChange} />
      )}
    </Backdrop>
  )
}

type Typed = { of: InboxData['detail']; values: InboxDrafts['values'] }

export function InboxScreen({ viewport, ...props }: InboxScreenProps) {
  // What Erik types in the open item lives here, above the layout: a width change swaps the layout and remounts its
  // fields, and this keeps their text. Another item starts empty.
  const item = props.data.detail
  const [typed, setTyped] = useState<Typed>({ of: item, values: {} })
  const drafts: InboxDrafts = {
    values: typed.of === item ? typed.values : {},
    onChange: (field: InboxDraftField, value: string) => {
      setTyped((t) => ({ of: item, values: { ...(t.of === item ? t.values : {}), [field]: value } }))
    },
  }
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => <InboxLayout layout={layout} drafts={drafts} {...props} />}
    </ViewportFrame>
  )
}
