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
// The composer drafts are saved in sessionStorage as they change and read
// back on load, so Reload app keeps them; a sent chat's draft leaves it
// (draftStorage.ts). They live in a draft book (blocks/draftBook.ts), so a keystroke never renders this page (R28).
// Every reply's Copy, sample or live, writes the clipboard
// here through copyText, and its button shows Copied or Copy failed; a fault
// is reported with the clipboard's error only, never the reply's text (audit P-4).
// A live Claude chat's /compact and /clear go to the server from their dialog (liveSend.ts, W5). When a live chat's ID
// changes on its pane (/clear, from the page or the terminal), the owner's changes move to the new ID before the page
// draws the new list (paneFollow.ts): the open chat stays open, now the new one, with an empty composer.
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { readsLive } from '../../lib/dataSource.ts'
import { workspacesSources } from './loadWorkspacesState.ts'
import { createDraftBook } from './blocks/draftBook.ts'
import { layoutsSeenOf, withLoadedLayouts } from './blocks/workspaceLayout.ts'
import { loadDrafts, saveDrafts } from './draftStorage.ts'
import { chatPanesOf, paneMoves, withMovedChats } from './paneFollow.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import type { ComposerAnswer } from './blocks/useComposerActions.ts'
import { useLiveTranscripts } from './useLiveTranscripts.ts'
import { useLiveUploads } from './useLiveUploads.ts'
import {
  useSeenPanes,
  useWorkspacesActions,
  useWorkspacesUi,
  workspacesDraftBook,
  type WorkspacesStateKey,
} from './workspacesStore.ts'

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
  useEffect(() => {
    let stop: (() => void) | undefined
    let gone = false
    if (import.meta.env.DEV && live) {
      void import('./liveWorkspaces.ts').then((live) => {
        if (!gone) stop = live.watchLiveWorkspaces({ onChange: () => void router.invalidate() })
      })
    }
    return () => {
      gone = true
      stop?.()
    }
  }, [router, live])
  // Pane follow (W5): a chat whose ID changed on its pane since the last list takes the changes of its old ID, in this
  // render already, and in the store before the browser paints.
  const panes = useMemo(() => chatPanesOf(state.data), [state.data])
  const changed = useMemo(() => withMovedChats(edits, paneMoves(seen, panes)), [edits, seen, panes])
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
  useLayoutEffect(() => {
    uiRef.current = ui
  })
  const { data, transcripts } = useLiveTranscripts(import.meta.env.DEV && live, state.data)
  const files = useLiveUploads(import.meta.env.DEV && live)
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
  return (
    <WorkspacesScreen
      data={data}
      ui={ui}
      viewport="desktop"
      drafts={drafts}
      onUiChange={(change) => {
        // Each change keeps the layouts and focus the owner sees now, and which loaded layouts he saw, so a newer one
        // replaces only what he changed before it came.
        const now = uiRef.current
        setUi(search.state, {
          ...(now.layouts === undefined ? {} : { layouts: now.layouts, focusedPane: now.focusedPane }),
          ...change,
          layoutsSeen: layoutsSeenOf(state.ui.layouts),
        })
      }}
      onRetry={() => void router.invalidate()}
      transcripts={transcripts}
      onCopy={copyReply}
      onSend={(chat, text) =>
        pendingRef.current.has(`clear:${chat}`)
          ? Promise.resolve(false)
          : once(`send:${chat}`, () => {
              const liveChat = liveChatOf(chat)
              if (liveChat !== undefined) {
                const attached = files.readyOf(chat)
                files.sending(attached)
                const posted = viaLive((m) => m.sendPrompt(liveChat, text, attached))
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
      }
      filesOf={(chat) => files.filesOf(chat, liveChatOf(chat))}
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
          : once(`command:${chat}`, () => viaLive((m) => m.sendCommand(liveChat, request)))
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
  )
}
