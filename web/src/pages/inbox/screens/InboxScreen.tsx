// The Inbox page as one props-only screen: the rail, the list pane and the
// open item on the app shell. A state file's data and ui are its props;
// the callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import { RemoveDialog } from '../blocks/RemoveDialog.tsx'
import type { InboxData, InboxGroupId, InboxProposal, InboxUi } from '../types.ts'
import { InboxDetail } from './InboxDetail.tsx'
import { InboxListPane } from './InboxListPane.tsx'

export type InboxScreenProps = {
  data: InboxData
  ui: InboxUi
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
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

export function InboxScreen({
  data,
  ui,
  viewport,
  onNavigate,
  onFilterChange,
  onGroupOpenChange,
  onSelectItem,
  onPromptOpenChange,
  query,
  onQueryChange,
  onRemoveOpenChange,
}: InboxScreenProps) {
  const { discussion } = data
  const discussing = discussion !== undefined && ui.discussOpen
  const remove = removal(data)
  return (
    <Backdrop size={viewport}>
      <AppShell
        size={viewport}
        view={ui.selectedId === null ? 'list' : 'detail'}
        rail={<AppRail selected="inbox" inboxBadge={data.railBadge} onSelect={onNavigate} />}
        list={
          discussing ? undefined : (
            <InboxListPane
              data={data}
              ui={ui}
              onFilterChange={onFilterChange}
              onGroupOpenChange={onGroupOpenChange}
              onSelectItem={onSelectItem}
              query={query}
              onQueryChange={onQueryChange}
            />
          )
        }
        detail={
          data.detail === null ? undefined : (
            <InboxDetail
              detail={data.detail}
              ui={ui}
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
        }
      />
      {remove === undefined ? null : (
        <RemoveDialog proposal={remove} open={ui.removeOpen} onOpenChange={onRemoveOpenChange} />
      )}
    </Backdrop>
  )
}
