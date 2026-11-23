// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It merges the loaded state with what the owner
// changed in it (the page store), passes everything to the screen as props,
// and goes to the page the owner picks in the rail, the phone's tab bar or its
// More drawer. When it reads the live source in development (its home, or
// `?source=live`, d-117) it watches the server's events while it shows
// (liveWorkspaces.ts) and loads its state again when they change it, and the
// live-unavailable notice's Retry loads it again; each live chat pane reads
// its transcript while it shows (useLiveTranscripts.ts); a build has no live code. A live Claude chat's Send and
// Stop go to the server (liveSend.ts, W1), to the chat whose composer sent them, as does a clear of its terminal
// input (R28 part B); any other chat's Send goes to the
// page store's `send`, and a failed send is reported. A failed send keeps the composer's draft. A live Claude chat's
// files upload as the owner adds them (useLiveUploads.ts, W1b), and its send names the ones ready, in the chips'
// order: a send that goes through takes them out of the composer, and a 409 upload-conflict fails them.
// A live Claude chat's send shows at once as a pending bubble with its file chips, until the transcript stream brings
// its entry; a miss removes it, and the composer puts the text back (useLivePending.ts, livePending.ts). Each send has
// a new send ID and is kept beside the drafts until its answer or its entry comes, so a reload meanwhile reads its result
// and puts the text back when it did not reach the chat (keptSends.ts, backend #369).
// The composer drafts are saved in sessionStorage as they change and read
// back on load, so Reload app keeps them; a sent chat's draft leaves it
// (draftStorage.ts). They live in a draft book (blocks/draftBook.ts), so a keystroke never renders this page (R28).
// Every reply's Copy, sample or live, writes the clipboard
// here through copyText, and its button shows Copied or Copy failed; a fault
// is reported with the clipboard's error only, never the reply's text (audit P-4).
// A live Claude chat's /compact and /clear go to the server from their dialog (liveSend.ts, W5). When a live chat's ID
// changes on its pane (/clear, from the page or the terminal), the owner's changes move to the new ID before the page
// draws the new list (paneFollow.ts): the open chat stays open, now the new one, with an empty composer.
// A live chat's focus, zoom, swap, close, split and move go to the server (useLayoutWrites.ts, W2), and the page waits
// for the layout read after `layout.changed` to move a pane. A move of the open pane to another tab shows that tab
// once the layout read has the chat there (W2d, `shownTabs.ts`). New chat starts a live Claude chat and opens it once
// the workspace list shows it (useNewChat.ts, W3). A live Claude chat's model chip picks its effort for the session
// (useLiveEffort.ts, W10), through the server's effort route only, never by sending /effort. The same chip restarts
// the chat with another model by resume (useLiveModel.ts), never by sending /model: while the restart runs the chat's
// composer is off, and a restart that ended the chat and started none opens a dialog with the command to resume it.
// A live workspace's rename, a live chat's rename (herdr's pane label) and the workspaces' order go to the server one
// at a time and show from the list read after `workspaces.changed` (useWorkspaceEdits.ts, reviews R41, R42).
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { readsLive } from '../../lib/dataSource.ts'
import { useInboxBadge, useInboxStreamHost } from '../../lib/inboxFeed.ts'
import { workspacesSources } from './loadWorkspacesState.ts'
import { createDraftBook } from './blocks/draftBook.ts'
import { layoutsSeenOf, openChat, withLoadedLayouts } from './blocks/workspaceLayout.ts'
import { followTab, withShownTabs } from './shownTabs.ts'
import { dropRestored, dropSend, keepSend, loadDrafts, markRestored, newSendId, saveDrafts } from './draftStorage.ts'
import { chatPanesOf, paneMoves, withMovedChats } from './paneFollow.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import type { ComposerAnswer } from './blocks/useComposerActions.ts'
import type { WorkspacesUi } from './types.ts'
import { ModelRestartFailed } from './blocks/ModelRestartFailed.tsx'
import { useLiveEffort } from './useLiveEffort.ts'
import { keptOnPane, useLiveModel, withRestarting } from './useLiveModel.ts'
import { useLiveSkills } from './useLiveSkills.ts'
import { useLiveTranscripts } from './useLiveTranscripts.ts'
import { useLayoutWrites } from './useLayoutWrites.ts'
import { useWorkspaceEdits } from './useWorkspaceEdits.ts'
import { useLivePending } from './useLivePending.ts'
import { useLiveUploads } from './useLiveUploads.ts'
import { useChatLink } from './useChatLink.ts'
import { useNewChat } from './useNewChat.ts'
import {
  useSeenPanes,
  useWorkspacesActions,
  useWorkspacesUi,
  workspacesDraftBook,
  type WorkspacesStateKey,
} from './workspacesStore.ts'
import { usePushSwitch } from '../../state/pushStore.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'

const route = getRouteApi('/workspaces')

/**
 * A draft book for `state`, from the drafts saved before the last reload. Each change is saved in sessionStorage first,
 * so a keystroke that crashes the page is kept for Reload app.
 */
const draftsFor = (state: WorkspacesStateKey) =>
  createDraftBook(loadDrafts(state), (drafts) => {
    saveDrafts(state, drafts)
  })

/** The live module's send, stop or command, loaded when first used; a module that fails to load is reported. */
const viaLive = (use: (live: typeof import('./liveSend.ts')) => Promise<ComposerAnswer>): Promise<ComposerAnswer> =>
  import('./liveSend.ts').then(use, (error: unknown) => {
    report(error, 'handler')
    return false
  })

/** A reply's Copy: a refusal that is not the browser's NotAllowedError goes to `report`, without the text. */
const copyReply = (text: string) =>
  copyText(text, {
    report: (error) => {
      report(error, 'handler')
    },
  })

export function WorkspacesPage() {
  const state = route.useLoaderData()
  const push = usePushSwitch()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const edits = useWorkspacesUi(search.state)
  const seen = useSeenPanes(search.state)
  const { setUi, showState, send, followPanes } = useWorkspacesActions()
  const router = useRouter()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  const live = readsLive({ state: search.state, source: search.source }, workspacesSources)
  // The page's stream also gives the app's Inbox badge its events, so the app holds one stream (lib/inboxFeed.ts).
  const inboxChanged = useInboxStreamHost(live)
  useEffect(() => {
    let stop: (() => void) | undefined
    let gone = false
    if (import.meta.env.DEV && live) {
      void import('./liveWorkspaces.ts').then((live) => {
        if (!gone) stop = live.watchLiveWorkspaces({ onChange: () => void router.invalidate(), onInbox: inboxChanged })
      })
    }
    return () => {
      gone = true
      stop?.()
    }
  }, [router, live, inboxChanged])
  // Pane follow (W5): a chat whose ID changed on its pane since the last list takes the changes of its old ID, in this
  // render already, and in the store before the browser paints.
  // Each live Claude chat's model (W10): while a restart runs, the chat's composer is off and says so.
  // A restarted chat reads its transcript again, as its stream may have ended (not-found) while the chat restarted.
  const retryTranscriptRef = useRef<(liveChat: string) => void>(() => undefined)
  const models = useLiveModel(import.meta.env.DEV && live, state.data, (liveChat) => {
    retryTranscriptRef.current(liveChat)
  })
  // A chat whose restart runs stays on its pane for pane follow, even while the list shows a shell there.
  const panes = useMemo(() => keptOnPane(chatPanesOf(state.data), models.restarting), [state.data, models.restarting])
  const moves = useMemo(() => paneMoves(seen, panes), [seen, panes])
  const changed = useMemo(() => withMovedChats(edits, moves), [edits, moves])
  useLayoutEffect(() => {
    followPanes(search.state, panes)
  }, [followPanes, search.state, panes])
  // The drafts of the shown state, one book for every visit: another `?state=` gets its own.
  const drafts = workspacesDraftBook(search.state, () => draftsFor(search.state))
  // One object per change, so the screen starts again from the merged ui only when the store changes. A loaded layout
  // newer than the owner's change, such as a herdr layout read again, replaces his (withLoadedLayouts).
  const current = state.data.current
  const ui = useMemo(() => withLoadedLayouts(state.ui, changed, current), [state.ui, changed, current])
  // The ui now, also for a change that comes after a later render: a send that ends after the owner opened another
  // chat clears its draft, and must keep the layouts and focus he sees then, not the ones of the render that sent it.
  const uiRef = useRef(ui)
  const loadedRef = useRef(state.ui.layouts)
  useLayoutEffect(() => {
    uiRef.current = ui
    loadedRef.current = state.ui.layouts
  })
  // Each change keeps the layouts and focus the owner sees now, and which loaded layouts he saw, so a newer one replaces
  // only what he changed before it came.
  const changeUi = (change: Partial<WorkspacesUi>) => {
    const now = uiRef.current
    setUi(search.state, {
      ...(now.layouts === undefined ? {} : { layouts: now.layouts, focusedPane: now.focusedPane }),
      ...change,
      layoutsSeen: layoutsSeenOf(loadedRef.current),
    })
  }
  const { data: liveData, transcripts } = useLiveTranscripts(import.meta.env.DEV && live, state.data)
  useLayoutEffect(() => {
    retryTranscriptRef.current = (liveChat) => {
      transcripts?.retry(liveChat)
    }
  })
  // A tab the workbench follows a moved chat to (W2d) shows in place of herdr's active tab, drawn from each layout read.
  const { data, ui: shownUi } = useMemo(() => withShownTabs(liveData, ui), [liveData, ui])
  const files = useLiveUploads(import.meta.env.DEV && live)
  const pendings = useLivePending(import.meta.env.DEV && live, search.state, drafts)
  // Each live Claude chat's "/" list, read from the server each time it opens (review R34).
  const skillLists = useLiveSkills(import.meta.env.DEV && live)
  // Each live Claude chat's effort (W10): a set level shows until the next list read.
  const efforts = useLiveEffort(import.meta.env.DEV && live, state.data)
  // The Inbox badge: the app's live count on the live home, the shown state's number on fixtures (lib/inboxFeed.ts).
  const railBadge = useInboxBadge(data.railBadge, live)
  const screenData = withRestarting({ ...data, railBadge }, models.isRestarting)
  const layoutWrites = useLayoutWrites(import.meta.env.DEV && live, data, (workspace, chat, tab) => {
    changeUi(followTab(liveData, uiRef.current, workspace, chat, tab))
  })
  // The live list's edits (R41, R42): renames, the workspaces' order and a close, shown from the next list read.
  // A chat moved to another workspace (backend #435) keeps its ID: the list read that shows it moved opens it there, as
  // a tap on its row would, and the phone's or tablet's open chat stays open. herdr puts it in a new tab of that
  // workspace, which is not its active one, so once a layout read lists that tab the workbench shows it, as it does
  // after a Move to tab (W2d, `followTab`).
  const movedRef = useRef<{ readonly chat: string; readonly workspace: string } | undefined>(undefined)
  const workspaceEdits = useWorkspaceEdits(import.meta.env.DEV && live, data, (chat, next) => {
    const owner = next.workspaces.find((w) => w.chats?.some((c) => c.id === chat))?.id
    movedRef.current = owner === undefined ? undefined : { chat, workspace: owner }
    changeUi(openChat(next, uiRef.current, chat))
  })
  useEffect(() => {
    const moved = movedRef.current
    const tab =
      moved === undefined ? undefined : liveData.liveTabs?.[moved.workspace]?.find((t) => t.chats.includes(moved.chat))
    if (moved === undefined || tab === undefined) return
    movedRef.current = undefined
    if (!tab.active && tab.id !== undefined)
      changeUi(followTab(liveData, uiRef.current, moved.workspace, moved.chat, tab.id))
  })
  // The file chips of a chat that left for a new ID on its pane go, as its draft stays behind: the server holds each
  // upload for the chat that started it, so the new chat's send could not name them.
  // Its pending send goes as its pane stops reading its transcript (livePending.ts).
  useEffect(() => {
    for (const old of moves.keys()) files.drop(old)
  }, [moves, files])
  // A tap on a push notification links to one chat (`?chat=`, d-118): it opens as a tap on its row would.
  const currentUi = useCallback(() => uiRef.current, [])
  const clearChatLink = useCallback(() => {
    void navigate({ search: (prev) => ({ ...prev, chat: undefined }), replace: true })
  }, [navigate])
  // A chat made since the page last read the list is not in the list it comes back with: the link reads it again.
  const readAgain = useCallback(
    async (chat: string) => {
      if (!(import.meta.env.DEV && live)) return false
      const listed = await import('./liveWorkspaces.ts').then((l) => l.serverListsChat(chat))
      if (listed) void router.invalidate()
      return listed
    },
    [router, live],
  )
  useChatLink(search.chat, data, currentUi, changeUi, clearChatLink, readAgain)
  // The sends and stops in flight, by chat: a pane keeps its own guard only while it shows, so a chat opened again while
  // its send or stop is pending must not post a second one. `once` answers `false` (nothing sent) meanwhile. A send and a
  // clear of the chat's terminal input go one after the other: no send starts while a clear is pending, as the clear
  // sends the draft itself once it answers, and a clear waits for a send that is pending, so its resend is not refused.
  const pendingRef = useRef(new Map<string, Promise<ComposerAnswer>>())
  const once = (key: string, run: () => Promise<ComposerAnswer>): Promise<ComposerAnswer> => {
    const pending = pendingRef.current
    if (pending.has(key)) return Promise.resolve(false)
    const running = run().finally(() => {
      pending.delete(key)
    })
    pending.set(key, running)
    return running
  }
  // The server ID of the live Claude chat whose pane is `chat`, read when its composer sends: none for a sample chat.
  const liveChatOf = (chat: string) => {
    if (!import.meta.env.DEV || !live) return undefined
    const pane = data.panes.find((p) => p.id === chat)
    return pane?.type === 'chat' ? pane.liveChat : undefined
  }
  const onSend = (chat: string, text: string): Promise<ComposerAnswer> =>
    pendingRef.current.has(`clear:${chat}`)
      ? Promise.resolve(false)
      : once(`send:${chat}`, () => {
          const liveChat = liveChatOf(chat)
          if (liveChat !== undefined) {
            const attached = files.readyOf(chat)
            const names = files.sending(attached)
            // A new ID for each send: the server refuses one it has seen (409 duplicateSend).
            const sendId = newSendId()
            const settled = () => {
              dropSend(search.state, sendId)
            }
            // A send whose request got no answer before is settled by this one: the owner acted on its text.
            dropRestored(search.state, chat)
            keepSend(search.state, { chat, liveChat, sendId, text, files: [...names], at: Date.now() })
            const bubble = pendings.start(liveChat, text, names, settled)
            const posted = viaLive((m) => m.sendPrompt(liveChat, text, attached, sendId))
            // An answer settles the kept send: a miss puts the text back in the draft, which is saved. With no answer
            // the server may have it, and a reload ends the request so in the second before the page goes: the text
            // goes back in the draft, and the kept send stays, marked, for the next load to read (keptSends.ts).
            void posted.then(
              (answer) => {
                if (typeof answer === 'object' && answer.noAnswer === true) markRestored(search.state, sendId)
                else settled()
                if (answer === true) bubble?.sent()
                else bubble?.missed()
              },
              () => {
                settled()
                bubble?.missed()
              },
            )
            // A file removed while the send is pending is deleted only when the send did not go through.
            void posted.then(
              (answer) => {
                files.settled(attached, answer === true)
              },
              () => {
                files.settled(attached, false)
              },
            )
            return posted.then((answer) => {
              if (answer === true) files.sent(chat, attached)
              else if (typeof answer === 'object' && answer.uploadConflict === true) files.conflict(chat, attached)
              // A clear of the terminal input is one at a time for the chat, as its send is, in any pane that shows it.
              if (typeof answer !== 'object' || answer.clearInput === undefined) return answer
              const clearInput = answer.clearInput
              const sending = () => pendingRef.current.get(`send:${chat}`) ?? Promise.resolve(false)
              return {
                ...answer,
                clearInput: () => once(`clear:${chat}`, () => sending().then(clearInput, clearInput)),
              }
            })
          }
          return send(chat, text).then(
            () => true,
            (error: unknown) => {
              report(error, 'handler')
              return false
            },
          )
        })
  // New chat (W3): Start chat starts a live Claude chat and opens it when the list shows it (useNewChat.ts).
  const newChat = useNewChat(import.meta.env.DEV && live, {
    data,
    herdrTabs: liveData.liveTabs,
    open: ui.newChatOpen === true,
    ui: currentUi,
    change: changeUi,
    send: onSend,
    drafts,
    readList: () => void router.invalidate(),
  })
  return (
    <>
      <WorkspacesScreen
        push={push}
        navPages={navPages}
        data={screenData}
        ui={shownUi}
        viewport="desktop"
        drafts={drafts}
        layoutWrites={layoutWrites}
        edits={workspaceEdits}
        onUiChange={changeUi}
        onRetry={() => void router.invalidate()}
        transcripts={transcripts}
        skillLists={skillLists}
        onCopy={copyReply}
        onSend={onSend}
        newChat={newChat}
        filesOf={(chat) => files.filesOf(chat, liveChatOf(chat))}
        pendingOf={(chat) => pendings.pendingOf(liveChatOf(chat))}
        effortOf={(chat) => {
          const pane = data.panes.find((p) => p.id === chat)
          const head = pane?.type === 'chat' ? pane.head : undefined
          const effort = efforts.of(chat, liveChatOf(chat), head?.effortLevel)
          return effort === undefined
            ? undefined
            : { ...effort, model: models.of(chat, liveChatOf(chat), head?.modelId) }
        }}
        onStop={(chat) => {
          const liveChat = liveChatOf(chat)
          return liveChat === undefined
            ? Promise.resolve(false)
            : once(`stop:${chat}`, () => viaLive((m) => m.stopChat(liveChat)))
        }}
        onCommand={(chat, request) => {
          const liveChat = liveChatOf(chat)
          return liveChat === undefined
            ? Promise.resolve(false)
            : once(`command:${chat}`, () =>
                viaLive((m) => m.sendCommand(liveChat, request)).then((answer) => {
                  // The server sends no event when the cleared chat gets its new ID: read the list until it shows.
                  if (answer === true && request.command === 'clear')
                    void import('./liveWorkspaces.ts').then((m) => m.readAfterClear(liveChat))
                  return answer
                }),
              )
        }}
        onNavigate={(page) => {
          // The tablet's More (the phone opens its drawer) goes to Toolkit, the one page behind More with a route
          // (d-105), as the tablet has no rail.
          if (page === 'more') void navigate({ to: '/toolkit' })
          // Only the pages that have a route go somewhere; the others wait for theirs.
          else if (page === 'inbox' || page === 'workspaces' || page === 'artifacts' || page === 'toolkit')
            void navigate({ to: `/${page}` })
        }}
      />
      <ModelRestartFailed
        session={models.failed}
        onClose={models.dismissFailed}
        onCopy={(text) => copyReply(text).then((copied) => copied.ok)}
      />
    </>
  )
}
