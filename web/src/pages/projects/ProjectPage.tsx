// A project's page (`/projects/<slug>`, R4): the connected entry of the
// project route, which reads the router and stores as ProjectsPage does for
// the home. It keeps what the owner changes (the tab, the More drawer) for the
// shown `?state=`, and Back to Projects opens the home. Quick chat works on the
// live project only (liveQuickChat.ts): each send is a new start, Retry the last.
// The Inbox panel loads again on each `inbox.changed` burst (no timer, NCC-138),
// and the Chats panel too while the Overview tab is open (NCC-130).
// The tab is in the address (`?tab=ideas`), so a reload and the browser's Back
// keep it (R10).
// Run check (R9) keeps its busy state here, as the server has none.
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useInboxBadge, useInboxChanges, useProjectsChanges } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import type { ProjectChats, ProjectInbox } from './liveProjects.ts'
import type { QuickChatAttempt } from './liveQuickChat.ts'
import { ProjectsScreen } from './screens/ProjectsScreen.tsx'
import type { ProjectDrift, ProjectsUi } from './types.ts'

const route = getRouteApi('/projects_/$slug')

type Changed = { of: string | undefined; ui: Partial<ProjectsUi> }

export function ProjectPage() {
  const state = route.useLoaderData()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}), tab: search.tab ?? state.ui.tab }
  // The search with `tab` as given; a key with no value is left out, so the address has none.
  const view = (tab: ProjectsUi['tab']) => ({
    ...(search.state === undefined ? {} : { state: search.state }),
    ...(search.source === undefined ? {} : { source: search.source }),
    ...(tab === undefined || tab === 'overview' ? {} : { tab }),
  })
  const live = state.data.live !== undefined
  const railBadge = useInboxBadge(state.data.railBadge, live)
  // The Inbox panel's latest read after a change, for the loaded state it replaces.
  const [inbox, setInbox] = useState<{ of: typeof state; read: ProjectInbox } | undefined>(undefined)
  const readingRef = useRef<AbortController | undefined>(undefined)
  const shown = inbox?.of === state ? inbox.read : undefined
  // The server's PR answer changed after a run behind a read (NCC-156): the loader reads the project again.
  const router = useRouter()
  useProjectsChanges(live && state.ui.open !== undefined, () => void router.invalidate())
  // The Chats panel's latest read after a change. One read at a time; a change during it gives one more after it.
  const [chats, setChats] = useState<{ of: typeof state; read: ProjectChats } | undefined>(undefined)
  const chatsRef = useRef({ busy: false, again: false, gone: false })
  // The latest render's read, so a tab change counts at once: only while the Overview tab is open.
  const readChatsRef = useRef<() => void>(() => undefined)
  useEffect(() => {
    readChatsRef.current = () => {
      const [slug, flight] = [state.ui.open, chatsRef.current]
      if (slug === undefined || (ui.tab ?? 'overview') !== 'overview' || flight.gone) return
      if (flight.busy) return void (flight.again = true)
      flight.busy = true
      void import('./liveProjects.ts')
        .then((m) => m.readProjectChats(slug))
        .then((read) => {
          // A read that missed keeps the rows shown, as the Inbox's does.
          if (read.notRead === undefined && !flight.gone) setChats({ of: state, read })
        })
        .finally(() => {
          const again = flight.again
          flight.busy = flight.again = false
          if (again) readChatsRef.current()
        })
    }
  })
  // StrictMode runs this cleanup once on mount, so the mount sets the flag back.
  useEffect(() => {
    const flight = chatsRef.current
    flight.gone = false
    return () => {
      flight.gone = true
    }
  }, [])
  useInboxChanges(
    live && state.ui.open !== undefined,
    () => {
      const slug = state.ui.open
      if (slug === undefined) return
      readingRef.current?.abort()
      const reading = (readingRef.current = new AbortController())
      void import('./liveProjects.ts')
        .then((m) => m.readProjectInbox(slug, reading.signal))
        .then((read) => {
          // A read after a change that missed keeps the rows shown; the loader's miss shows its line.
          if (read.count !== undefined && !reading.signal.aborted) setInbox({ of: state, read })
        })
        .catch((thrown: unknown) => {
          // A read that a leave or a later change stopped throws its abort.
          if (!reading.signal.aborted) throw thrown
        })
      readChatsRef.current()
    },
    shown?.count ?? railBadge,
  )
  useEffect(() => () => readingRef.current?.abort(), [])
  const shownChats = chats?.of === state ? chats.read : undefined
  const loaded = state.data.overview
  const overview =
    loaded === undefined
      ? undefined
      : { ...loaded, inbox: shown?.inbox ?? loaded.inbox, chats: shownChats ?? loaded.chats }
  // The Context drift panel after a Run check, for the loaded state it replaces.
  const [drift, setDrift] = useState<{ of: typeof state; view: ProjectDrift } | undefined>(undefined)
  const shownDrift = drift?.of === state ? drift.view : state.data.overview?.drift
  const runDrift = async () => {
    const slug = state.ui.open
    if (slug === undefined || shownDrift === undefined || shownDrift.busy === true) return
    const before = shownDrift
    setDrift({ of: state, view: { ...before, busy: true, notRead: undefined } })
    const result = await import('./liveProjects.ts').then((live) => live.runDrift(slug))
    setDrift({ of: state, view: result.ok ? result.value : { ...before, busy: false, notRead: result.error } })
  }
  const changeUi = (change: Partial<ProjectsUi>) => {
    setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
  }
  const attemptRef = useRef<QuickChatAttempt | undefined>(undefined)
  // Each run, a close and the unmount count up, so a late answer of an older run changes nothing.
  const runRef = useRef(0)
  useEffect(() => () => void (runRef.current += 1), [])
  const run = async (next: QuickChatAttempt): Promise<boolean> => {
    attemptRef.current = next
    const ran = (runRef.current += 1)
    changeUi({ quickChat: { busy: true } })
    const result = await import('./liveQuickChat.ts').then((live) => live.quickChat(next))
    if (ran !== runRef.current) return false
    if ('chat' in result) void navigate({ to: '/workspaces', search: { chat: result.chat } })
    else changeUi({ quickChat: { line: result.line, retry: result.retry } })
    return 'chat' in result
  }
  const slug = state.ui.open
  return (
    <ProjectsScreen
      settingsEntry
      navPages={navPages}
      data={{ ...state.data, railBadge, overview: overview && { ...overview, drift: shownDrift } }}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        const to = navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
      onUiChange={(change) => {
        if ('quickChat' in change && change.quickChat === undefined) runRef.current += 1
        if (change.tab !== undefined) void navigate({ search: view(change.tab) })
        else changeUi(change)
      }}
      onBack={() => void navigate({ to: '/projects', search: { source: search.source } })}
      onQuickChatSend={
        state.data.live === undefined || slug === undefined
          ? undefined
          : (text) => run({ project: slug, text, createId: crypto.randomUUID(), sendId: crypto.randomUUID() })
      }
      onRunDrift={state.data.live === undefined ? undefined : () => void runDrift()}
      onChatOpen={(chat) => void navigate({ to: '/workspaces', search: { chat } })}
      onQuickChatRetry={() => {
        if (attemptRef.current !== undefined) void run(attemptRef.current)
      }}
    />
  )
}
