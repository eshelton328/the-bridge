// The Inbox page as one props-only screen, laid out by the width it gets
// (ViewportFrame): on the desktop, the rail, the list pane and the open
// item side by side; on the tablet and phone, the list or the open item
// full width, with Back on the item and the tab bar under both, except in a
// chat or a discussion (Figma T1 to T8, T17). The open task's discussion
// sits beside it on the desktop and on a page of its own on a tablet or
// phone; what the owner does to its proposals changes the task and the list
// (`discussionView`). A state file's data and ui are its props; the
// callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import type { ProposalControl } from '../blocks/ProposalCard.tsx'
import { RemoveDialog } from '../blocks/RemoveDialog.tsx'
import { RowActionsSheet } from '../blocks/RowActionsSheet.tsx'
import { RowDetail } from '../blocks/RowDetail.tsx'
import type { InboxDraftField, InboxDrafts, InboxData, InboxGroupId, InboxPutAway, InboxUi } from '../types.ts'
import { DiscussionPage } from './DiscussionPage.tsx'
import {
  type DiscussionEffect,
  discussionView,
  proposalEffect,
  isRemoved,
  proposalOf,
  removeEffect,
  restoreEffect,
  undoCreateEffect,
  undoUpdateEffect,
} from './discussionView.ts'
import { InboxDetail } from './InboxDetail.tsx'
import { InboxListPane } from './InboxListPane.tsx'
import { listView } from './listView.ts'
import { startView } from './startView.ts'

export type InboxScreenProps = {
  data: InboxData
  ui: InboxUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** What the owner typed in the open item, from the page store; without it the screen keeps its own. */
  drafts?: InboxDrafts | undefined
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
  /** Back on a tablet or phone: closes the open item and shows the list. */
  onBack?: (() => void) | undefined
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** Copy in the whole prompt's dialog or sheet, with the prompt's text; the page entry copies it. */
  onCopyPrompt?: ((text: string) => void) | undefined
  /** The text the owner typed in the search field; without it the field shows the state's query. */
  query?: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  onRemoveOpenChange?: ((open: boolean) => void) | undefined
  /**
   * Reports what the owner changes in the view: a menu, the prompt editor or the
   * Run in picker opened or closed, the sort, the filters, an item
   * snoozed, marked done or dismissed, the discussion opened or closed, or
   * what he did to its proposals. The caller merges it into `ui`.
   */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
  /**
   * Sends the owner's message from the discussion's reply box. It resolves true once the message is sent, and the
   * caller adds it to `ui.sent` and empties the box; false keeps the draft (audit L-3). Without it, the screen adds the
   * message to the discussion and empties the box at once.
   */
  onSend?: ((text: string) => Promise<boolean>) | undefined
}

type InboxLayoutProps = Omit<InboxScreenProps, 'viewport' | 'drafts'> & { layout: Viewport; drafts: InboxDrafts }

function InboxLayout({ layout, drafts, ...props }: InboxLayoutProps) {
  const {
    ui,
    onNavigate,
    onSelectItem,
    onBack,
    onPromptOpenChange,
    onCopyPrompt,
    onRemoveOpenChange,
    onUiChange,
    onSend,
  } = props
  const data = startView(discussionView(props.data, ui), ui)
  const { discussion } = data
  const desktop = layout === 'desktop'
  // On the phone the tab bar's More opens the More drawer over it (Toolkit M4); picking a page navigates.
  const [moreOpen, setMoreOpen] = useState(false)
  // Where the tablet or phone list was scrolled when the owner opened a row, so Back shows the list at the same place.
  const [listScroll, setListScroll] = useState<number | undefined>(undefined)
  // Reply here on a started task's run card shows its chat in the task's place (M10 to M8). Back, labelled Inbox,
  // closes the chat and shows the list; the task opens again from its row. On the desktop, View task in the chat's
  // header or a click on the task's row closes the chat and shows the task.
  const task = data.detail
  const chat =
    ui.chatOpen && task?.kind === 'next' && task.launch.stage === 'started' ? task.launch.run.chat : undefined
  const item = chat ?? task
  const open = ui.selectedId === null ? null : item
  const discussOpen = discussion !== undefined && ui.discussOpen
  // The desktop puts the discussion beside the task; a tablet or phone gives it the task's page (T17).
  const discussing = desktop && discussOpen
  const discussPage = !desktop && discussOpen && open?.kind === 'next' ? discussion : undefined
  const remove = proposalOf(data, 'remove')
  // A task removed in its discussion has no Discuss in its task bar; its card opens the discussion and restores it.
  const removed = isRemoved(data, ui)
  // Only a chat hides the tab bar (T1 note): a started item's chat or a discussion fills the screen down to its reply box.
  const inChat = open?.kind === 'running' || discussPage !== undefined
  // On the phone the prompt editor's keyboard covers the bottom of the screen, tab bar and all (M3).
  const keyboard = layout === 'phone' && open?.kind === 'next' && ui.editingPrompt
  // The desktop always shows the state's item; the tablet and phone only the one the owner opened.
  const shown = desktop ? item : open
  const closeChat = () => {
    onUiChange?.({ chatOpen: false })
    onBack?.()
  }
  const selectItem =
    onSelectItem === undefined
      ? undefined
      : (id: string) => {
          if (ui.chatOpen || ui.rowOpen !== null) onUiChange?.({ chatOpen: false, rowOpen: null })
          onSelectItem(id)
        }
  // R11: on a tablet or phone a tap on a row the state has no detail for opens the row's own page, from the rows the
  // list shows (`listView`): a row the owner finished keeps its outcome, and a search's Done matches open too.
  const rowOpened =
    desktop || open !== null || ui.rowOpen === null
      ? undefined
      : listView(data, ui, props.query ?? data.search?.query ?? '')
          .groups.flatMap((g) => g.rows)
          .find((r) => r.id === ui.rowOpen)
  const closeRow = () => {
    onUiChange?.({ rowOpen: null, actionsFor: null })
  }
  const run = (effect: DiscussionEffect) => {
    if (effect.prompt !== undefined) drafts.onChange('prompt', effect.prompt)
    if (effect.removeOpen !== undefined) onRemoveOpenChange?.(effect.removeOpen)
    onUiChange?.(effect.ui)
    if (effect.back === true) onBack?.()
  }
  const control: ProposalControl = {
    decisions: ui.proposals,
    onAct: (kind, act) => {
      run(proposalEffect(data, ui, kind, act, desktop, drafts.values.prompt))
    },
    onCheck: (label, checked) => {
      // The boxes of created tasks say what was created; only Undo in the toast takes them back.
      if (ui.proposals.create === 'applied') return
      onUiChange?.({ proposalChecks: { ...ui.proposalChecks, [label]: checked } })
    },
  }
  // Send in the discussion's reply box: the message follows its entries (`discussionView`).
  const send = (text: string): boolean | Promise<boolean> => {
    if (onSend !== undefined) return onSend(text)
    onUiChange?.({ sent: [...ui.sent, text] })
    drafts.onChange('discussion', '')
    return true
  }
  const closeDiscussion = () => {
    onUiChange?.({ discussOpen: false })
  }
  // Snooze, Mark done or Dismiss takes the shown item out of the list, by the id the detail carries: after Back on a
  // tablet and a resize to the desktop nothing is selected, but the desktop still shows the item. Mark done and
  // Dismiss put it in Done, with how it ended. On a tablet or phone the list shows again. The desktop keeps showing
  // the item, so the owner can pick again: the last pick replaces the earlier one, and the item is never in the list twice.
  // A row's actions sheet on the phone (M6) puts a row away the same way, and closes.
  const putAway: InboxPutAway = (id, to) => {
    const snoozed = ui.snoozed.filter((s) => s.id !== id)
    const finished = ui.finished.filter((f) => f.id !== id)
    const closed = { snoozeOpen: false, actionsFor: null, rowOpen: null }
    onUiChange?.(
      'until' in to
        ? { ...closed, snoozed: [...snoozed, { id, until: to.until }], finished }
        : { ...closed, snoozed, finished: [...finished, { id, result: to.result }] },
    )
    onBack?.()
  }
  // The list draws the open task's row selected (d-101). The desktop shows the list and the state's task side by
  // side, so its row is selected even after Back on a tablet and a resize, when `ui.selectedId` is null; a tablet or
  // phone shows the list without a task, and selects the row of `ui.selectedId`.
  const selectedId = desktop ? (data.detail?.id ?? null) : ui.selectedId
  const list = (
    <InboxListPane
      data={data}
      ui={ui}
      selectedId={selectedId}
      layout={layout}
      onFilterChange={props.onFilterChange}
      onGroupOpenChange={props.onGroupOpenChange}
      onSelectItem={selectItem}
      onOpenRow={(id) => {
        onUiChange?.({ rowOpen: id })
      }}
      scrollTop={listScroll}
      onScrollSave={setListScroll}
      query={props.query}
      onQueryChange={props.onQueryChange}
      onUiChange={onUiChange}
      onToastAction={() => {
        run(undoCreateEffect(data, ui))
      }}
      onPutAway={putAway}
    />
  )
  // The discussed task's place, from its row.
  const place = data.groups.flatMap((g) => g.rows).find((row) => row.id === data.detail?.id)?.meta ?? ''
  const detail =
    discussPage !== undefined && open?.kind === 'next' ? (
      <DiscussionPage
        discussion={discussPage}
        task={open}
        place={place}
        layout={layout}
        onClose={closeDiscussion}
        control={control}
        drafts={drafts}
        onSend={send}
      />
    ) : rowOpened !== undefined ? (
      <>
        <RowDetail
          row={rowOpened}
          onBack={closeRow}
          onActions={
            rowOpened.outcome === undefined
              ? () => {
                  onUiChange?.({ actionsFor: rowOpened.id })
                }
              : undefined
          }
        />
        {ui.actionsFor === rowOpened.id ? (
          <RowActionsSheet
            row={rowOpened}
            kindLabel={data.filterMenu.sections[0]?.items.find((k) => k.value === rowOpened.kind)?.label ?? ''}
            menu={data.snoozeMenu}
            open
            onOpenChange={(next) => {
              if (!next) onUiChange?.({ actionsFor: null })
            }}
            onPick={(until) => {
              putAway(rowOpened.id, until === null ? { result: 'done' } : { until })
            }}
            onDismiss={() => {
              putAway(rowOpened.id, { result: 'dismissed' })
            }}
          />
        ) : null}
      </>
    ) : shown === null ? undefined : (
      <InboxDetail
        detail={shown}
        ui={ui}
        snoozeMenu={data.snoozeMenu}
        layout={layout}
        onBack={chat === undefined ? onBack : closeChat}
        onViewTask={
          chat === undefined
            ? undefined
            : () => {
                onUiChange?.({ chatOpen: false })
              }
        }
        drafts={drafts}
        onPromptOpenChange={onPromptOpenChange}
        onCopyPrompt={onCopyPrompt}
        onUiChange={onUiChange}
        onSnooze={(until) => {
          putAway(shown.id, until === null ? { result: 'done' } : { until })
        }}
        onDismiss={() => {
          putAway(shown.id, { result: 'dismissed' })
        }}
        onUndoChange={() => {
          run(undoUpdateEffect(ui))
        }}
        onStart={
          shown.kind === 'next' && shown.launch.stage === 'suggested'
            ? () => {
                onUiChange?.({
                  started: [...ui.started.filter((id) => id !== shown.id), shown.id],
                  // The started row moves to Running (`startView`), which opens to show it.
                  groupsOpen: { ...ui.groupsOpen, running: true },
                  // Start sends the prompt: its editor closes, as the sent prompt cannot change.
                  editingPrompt: false,
                })
              }
            : undefined
        }
        removed={
          removed
            ? {
                onOpenDiscussion: () => {
                  onUiChange?.({ discussOpen: true })
                },
                onRestore: () => {
                  run(restoreEffect(data, ui))
                },
              }
            : undefined
        }
        discuss={
          discussion === undefined || removed
            ? undefined
            : {
                open: discussing,
                onOpenChange: (next) => {
                  onUiChange?.({ discussOpen: next })
                },
              }
        }
        side={
          discussing ? (
            <DiscussionPanel
              discussion={discussion}
              control={control}
              onClose={closeDiscussion}
              drafts={drafts}
              onSend={send}
            />
          ) : undefined
        }
      />
    )
  return (
    <Backdrop size={layout}>
      <AppShell
        onDiagnostic={reportShellDiagnostic}
        size={layout}
        view={open === null && rowOpened === undefined ? 'list' : 'detail'}
        rail={desktop ? <AppRail selected="inbox" inboxBadge={data.railBadge} onSelect={onNavigate} /> : undefined}
        tabBarOverlay
        tabBar={
          desktop || inChat || keyboard ? undefined : (
            <AppTabBar
              selected="inbox"
              device={layout === 'tablet' ? 'tablet' : 'phone'}
              inboxBadge={data.railBadge}
              onSelect={(next) => {
                if (next === 'more' && layout === 'phone') setMoreOpen(true)
                else onNavigate?.(next)
              }}
            />
          )
        }
        list={discussing ? undefined : list}
        detail={detail}
      />
      {layout === 'phone' ? <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onNavigate={onNavigate} /> : null}
      {remove === undefined ? null : (
        <RemoveDialog
          proposal={remove}
          open={ui.removeOpen}
          layout={layout}
          onOpenChange={onRemoveOpenChange}
          onConfirm={() => {
            run(removeEffect(data, ui))
          }}
        />
      )}
    </Backdrop>
  )
}

type Typed = { of: InboxData['detail']; values: InboxDrafts['values'] }

export function InboxScreen({ viewport, drafts: pageDrafts, ...props }: InboxScreenProps) {
  // What the owner types in the open item lives here, above the layout: a width change swaps the layout and remounts its
  // fields, and this keeps their text. Another item starts empty.
  // The page passes its own drafts, kept in its store, so a visit to another page keeps them too.
  const item = props.data.detail
  const [typed, setTyped] = useState<Typed>({ of: item, values: {} })
  const drafts: InboxDrafts = pageDrafts ?? {
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
