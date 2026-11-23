// The Inbox's connected entry: the only component of the page that reads
// the router and the page store. It merges the loaded state with the URL
// and the store and passes everything to the props-only screen. On the live
// Inbox (liveInbox.ts) it reads the event stream while it shows and loads
// again on each `inbox.changed`. A row opens its item's detail, Open chat
// opens a chat item's chat in Workspaces (`/workspaces?chat=`), and Snooze,
// Mark done and Dismiss go to the server (useLiveItem.ts).
import { ChatId } from '@bridge/contract'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { readsLive } from '../../lib/dataSource.ts'
import { useInboxChanges } from '../../lib/inboxFeed.ts'
import {
  useInboxActions,
  useInboxDrafts,
  useInboxGroupsOpen,
  useInboxItemOpen,
  useInboxPromptOpen,
  useInboxQuery,
  useInboxRemoveOpen,
  useInboxUi,
} from './inboxStore.ts'
import { inboxSources } from './loadInboxState.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'
import { withNewBoxes } from './screens/listView.ts'
import { usePushSwitch } from '../../state/pushStore.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { useLiveItem } from './useLiveItem.ts'
import { watchLiveInbox } from './liveInbox.ts'

const reportCopy = (error: unknown) => {
  report(error, 'handler')
}

const route = getRouteApi('/inbox')

export function InboxPage() {
  const state = route.useLoaderData()
  const push = usePushSwitch()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const groupsOpen = useInboxGroupsOpen()
  const itemOpen = useInboxItemOpen(search.state)
  const promptOpen = useInboxPromptOpen(search.state)
  const removeOpen = useInboxRemoveOpen(search.state)
  const query = useInboxQuery(search.state)
  const changed = useInboxUi(search.state)
  const itemId = state.data.detail?.id
  const draftValues = useInboxDrafts(itemId)
  const {
    setGroupOpen,
    setItemOpen,
    setPromptOpen,
    setRemoveOpen,
    setQuery,
    setUi,
    showState,
    setDraft,
    send,
    markSent,
  } = useInboxActions()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  const router = useRouter()
  const live = readsLive({ state: search.state, source: search.source }, inboxSources)
  // The live list loads again on each `inbox.changed`, through the app's one stream (lib/inboxFeed.ts).
  useInboxChanges(live, () => void router.invalidate(), state.data.railBadge)
  // The live list's grace (R43b) keeps the list the page shows and loads again when it passes.
  useEffect(() => (live ? watchLiveInbox(() => void router.invalidate()) : undefined), [live, router])
  const ui = {
    ...state.ui,
    ...changed,
    filter: search.filter ?? state.ui.filter,
    groupsOpen: { ...state.ui.groupsOpen, ...groupsOpen },
    // Back on a tablet or phone closes the open item and shows the list; the desktop always shows the item. A tap on
    // the item's row opens it again: the state's own item is the one the mock data has a detail for.
    selectedId: itemOpen === undefined ? state.ui.selectedId : itemOpen ? (state.data.detail?.id ?? null) : null,
    promptOpen: promptOpen ?? state.ui.promptOpen,
    removeOpen: removeOpen ?? state.ui.removeOpen,
  }
  // The live menu changes with each read: a section that did not narrow the list when the owner set the filters
  // takes the boxes that came since, so a new kind or project is not hidden by checks made before it came.
  const seen = ui.filterSeen
  ui.filters = withNewBoxes(state.data.filterMenu, ui.filters, seen)
  ui.filterChecks = withNewBoxes(state.data.filterMenu, ui.filterChecks, seen)
  const liveItem = useLiveItem(
    state.data,
    ui.rowOpen,
    () => {
      setUi(search.state, { rowOpen: null })
    },
    () => router.invalidate(),
  )
  const liveData = state.data.live
  const data =
    liveData === undefined || liveItem.listLine === undefined
      ? state.data
      : { ...state.data, live: { ...liveData, line: liveItem.listLine } }
  return (
    <InboxScreen
      push={push}
      navPages={navPages}
      data={data}
      liveOpen={liveItem.open}
      onLiveAct={
        liveData === undefined
          ? undefined
          : (id, to) => {
              setUi(search.state, { snoozeOpen: false, actionsFor: null })
              liveItem.act(id, to)
            }
      }
      onOpenChat={(id) => {
        const chat = ChatId.safeParse(liveData?.items.find((i) => i.id === id)?.chat)
        if (chat.success) void navigate({ to: '/workspaces', search: { chat: chat.data } })
      }}
      drafts={{
        values: draftValues,
        onChange: (field, value) => {
          setDraft(itemId, field, value)
        },
      }}
      onNavigate={(page) => {
        // The tablet's More (the phone opens its drawer) goes to Toolkit, the one page behind More with a route
        // (d-105), as the tablet has no rail. Only the pages that have a route go somewhere; the others wait for theirs.
        if (page === 'more') void navigate({ to: '/toolkit' })
        else if (page === 'workspaces' || page === 'artifacts' || page === 'toolkit') void navigate({ to: `/${page}` })
      }}
      ui={ui}
      viewport="desktop"
      query={query}
      onGroupOpenChange={setGroupOpen}
      onBack={() => {
        setItemOpen(search.state, false)
      }}
      onSelectItem={() => {
        setItemOpen(search.state, true)
      }}
      onPromptOpenChange={(open) => {
        setPromptOpen(search.state, open)
      }}
      onCopyPrompt={(text) => {
        // copyText copies nothing, and throws nothing, on a page with no clipboard or one that refuses the write;
        // a refusal that is not the browser's NotAllowedError is a fault, so it goes to the reporter.
        void copyText(text, { report: reportCopy })
      }}
      onRemoveOpenChange={(open) => {
        setRemoveOpen(search.state, open)
      }}
      onQueryChange={(next) => {
        setQuery(search.state, next)
      }}
      onUiChange={(change) => {
        setUi(search.state, change)
      }}
      // A discussion's Send goes to the store's send; a failed send is reported, and the box keeps the draft (L-3).
      onSend={(text) =>
        send(itemId, text).then(
          () => {
            markSent(search.state, state.ui.sent, itemId, text)
            return true
          },
          (error: unknown) => {
            report(error, 'handler')
            return false
          },
        )
      }
      onFilterChange={(filter) => {
        void navigate({ search: (prev) => ({ ...prev, filter }) })
      }}
    />
  )
}
