// New chat on the live page (W3): the form's Start chat posts `POST
// /api/chats` (liveNewChat.ts) and the page opens the new chat once the
// workspace list shows it, matched by its pane.
//
// Each Start chat is a new start with a new create ID; Retry after a miss
// sends the same start, with the same create ID, so the server starts no
// second chat. Start chat is off while the start runs, and the form says
// "Starting…" until the chat opens. A start that answers `ready` or
// `needsYou` opens the chat when the list shows its pane (`workspaces.changed`
// brings it; the page reads the list once more itself); one that answers
// `starting`, or a `duplicateCreate` (the page has no pane then: the chat is
// the one the workspace did not list when the start began, with the name
// asked for), waits for the list to show it ready or needing the owner. The
// page reads no list in a loop. The chat opens as a tap on its row opens it,
// full screen on the phone; on the desktop the workbench shows its tab,
// while herdr's active tab and pane stay as they were. A ready chat gets the
// first message through the composer's send, with a new send ID; a chat that
// needs the owner gets the line "This chat needs you on the Mac" and the
// message in its composer. Cancel ends the wait: nothing opens and nothing is
// sent. Nothing goes to report() here; liveNewChat.ts reports a fault by
// kind and status, never a name or a message.
import { ChatName, StartChatRequest } from '@bridge/contract'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { report } from '../../errors/reporter.ts'
import type { DraftBook } from './blocks/draftBook.ts'
import type { NewChatStarter, NewChatValues } from './blocks/newChatStart.ts'
import type { ComposerAnswer } from './blocks/useComposerActions.ts'
import { openChat } from './blocks/workspaceLayout.ts'
import { newSendId } from './draftStorage.ts'
import { showNotice } from './livePending.ts'
import { followTab } from './shownTabs.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'

/** One start: its request (with its create ID), the workspace, the first message, and the panes listed before it. */
type Attempt = {
  readonly request: StartChatRequest
  readonly workspace: string
  readonly message: string
  readonly known: ReadonlySet<string>
}

/** A start that answered: its pane when the answer named one, and whether the answer said the chat was ready. */
type Follow = { readonly attempt: Attempt; readonly pane?: string | undefined; readonly ready: boolean }

const nameRule = 'Start with a small letter, then small letters, digits, - or _ (32 at most)'
const needsYouLine = 'This chat needs you on the Mac'

/** Each chat the workspaces list, with its workspace. */
const listed = (data: WorkspacesData) =>
  data.workspaces.flatMap((w) => (w.chats ?? []).map((chat) => ({ chat, workspace: w.id })))

export type NewChatDeps = {
  /** The data the screen draws: a tab the workbench follows is `active` in it (shownTabs.ts). */
  readonly data: WorkspacesData
  /** Herdr's own tabs, before the page's shown tabs: herdr's active tab is `active` in them. */
  readonly herdrTabs: WorkspacesData['liveTabs']
  /** Whether the form is open: closing it ends the start (Cancel). */
  readonly open: boolean
  readonly ui: () => WorkspacesUi
  readonly change: (change: Partial<WorkspacesUi>) => void
  /** The composer's send of a chat, by its pane id. */
  readonly send: (chat: string, text: string) => Promise<ComposerAnswer>
  readonly drafts: DraftBook
  /** Reads the workspace list again. */
  readonly readList: () => void
}

export function useNewChat(enabled: boolean, deps: NewChatDeps): NewChatStarter | undefined {
  const depsRef = useRef(deps)
  useLayoutEffect(() => {
    depsRef.current = deps
  })
  const attemptRef = useRef<Attempt | undefined>(undefined)
  const followRef = useRef<Follow | undefined>(undefined)

  /** Opens the followed chat once the list shows it ready or needing the owner, and sends its first message. */
  const resolve = useCallback(() => {
    const follow = followRef.current
    const { data, herdrTabs, ui, change, send, drafts } = depsRef.current
    if (follow === undefined) return
    if (ui().newChatOpen !== true) {
      followRef.current = undefined
      return
    }
    const { attempt } = follow
    const name = attempt.request.name
    const hit = listed(data).find(({ chat, workspace }) =>
      follow.pane === undefined
        ? workspace === attempt.workspace &&
          chat.pane !== undefined &&
          !attempt.known.has(chat.pane) &&
          (name === undefined || chat.title === name)
        : chat.pane === follow.pane,
    )
    if (hit === undefined) return
    const pane = data.panes.find((p) => p.id === hit.chat.id)
    const needsYou = hit.chat.status.tone === 'needsYou'
    const ready = !needsYou && (follow.ready || (pane?.type === 'chat' && pane.takesCommands === true))
    if (!ready && !needsYou) return
    // The desktop draws a chat in a herdr tab the layout read has: wait for the read that brings it. Herdr's own tabs
    // say which tab is herdr's active one, as the page may show another (shownTabs.ts).
    const tabs = herdrTabs?.[hit.workspace]
    const tab = tabs?.find((t) => t.chats.includes(hit.chat.id))
    if (tabs !== undefined && tab === undefined) return
    followRef.current = undefined
    attemptRef.current = undefined
    const now = ui()
    const opened: Partial<WorkspacesUi> = {
      ...openChat(data, now, hit.chat.id),
      phoneView: 'chat',
      newChatOpen: false,
      newChatStart: null,
      keyboardOpen: false,
    }
    // A chat in herdr's active tab shows that tab; one in another tab shows it in its place, as a moved chat does.
    const shown =
      tab?.id === undefined
        ? {}
        : tab.active
          ? {
              shownTabs: Object.fromEntries(
                Object.entries(now.shownTabs ?? {}).filter(([workspace]) => workspace !== hit.workspace),
              ),
            }
          : followTab(
              { liveTabs: herdrTabs, current: data.current },
              { ...now, ...opened },
              hit.workspace,
              hit.chat.id,
              tab.id,
            )
    change({ ...opened, ...shown })
    const liveChat = `${data.liveMachine ?? ''}/${hit.chat.id}`
    const message = attempt.message
    if (needsYou) {
      showNotice(liveChat, { line: needsYouLine, retry: false })
      if (message !== '') drafts.restore(hit.chat.id, message)
      return
    }
    if (message === '') return
    void send(hit.chat.id, message).then((answer) => {
      if (answer === true) return
      drafts.restore(hit.chat.id, message)
      if (typeof answer === 'object') showNotice(liveChat, { line: answer.line, retry: false })
    })
  }, [])

  // Each list and layout read may bring the followed chat.
  useEffect(() => {
    resolve()
  }, [deps.data, resolve])

  // Cancel ends the start: an answer that comes later opens nothing and sends nothing, even in a form opened again.
  useEffect(() => {
    if (deps.open) return
    attemptRef.current = undefined
    followRef.current = undefined
  }, [deps.open])

  const run = useCallback(
    (attempt: Attempt) => {
      const { change, readList } = depsRef.current
      change({ newChatStart: { busy: true } })
      void import('./liveNewChat.ts')
        .then((live) => live.startChat(attempt.request))
        .then(
          (answer) => {
            // Cancel, or another start, ended this one.
            if (attemptRef.current !== attempt) return
            const { change: set } = depsRef.current
            switch (answer.kind) {
              case 'started': {
                const { pane, chat, state } = answer.started
                followRef.current = { attempt, pane, ready: state === 'ready' && chat !== undefined }
                readList()
                resolve()
                return
              }
              case 'duplicateCreate':
                followRef.current = { attempt, ready: false }
                readList()
                resolve()
                return
              case 'nameTaken':
                attemptRef.current = undefined
                set({ newChatStart: { nameError: 'Another chat has this name' } })
                return
              case 'gone':
                attemptRef.current = undefined
                set({ newChatStart: { line: 'That chat or workspace is gone' } })
                readList()
                return
              case 'miss':
                set({ newChatStart: { line: answer.line, retry: answer.retry } })
            }
          },
          (error: unknown) => {
            report(error, 'handler')
            if (attemptRef.current === attempt) depsRef.current.change({ newChatStart: null })
          },
        )
    },
    [resolve],
  )

  const start = useCallback(
    (values: NewChatValues) => {
      const { data, ui, change } = depsRef.current
      const now = ui()
      if (now.newChatStart?.busy === true) return
      const typed = values.name.trim()
      if (typed !== '' && !ChatName.safeParse(typed).success) {
        change({ newChatStart: { nameError: nameRule } })
        return
      }
      const machine = data.liveMachine ?? ''
      // A blank name gets a random one here, so the page knows the chat by its name when the server's answer is lost
      // (duplicateCreate): another chat that starts in the workspace meanwhile has another name.
      const name = typed === '' ? `chat-${newSendId().slice(0, 6)}` : typed
      const request = StartChatRequest.safeParse({
        kind: 'claude',
        name,
        ...(values.model === 'default' ? {} : { model: values.model }),
        place: { in: 'tab', workspace: `${machine}/${values.workspace}` },
        // A new create ID for each Start chat; Retry keeps it.
        createId: newSendId(),
      })
      if (!request.success) {
        change({ newChatStart: { line: 'Could not start the chat' } })
        return
      }
      const known = new Set(listed(data).flatMap(({ chat }) => (chat.pane === undefined ? [] : [chat.pane])))
      const attempt = { request: request.data, workspace: values.workspace, message: values.message.trim(), known }
      attemptRef.current = attempt
      followRef.current = undefined
      run(attempt)
    },
    [run],
  )

  const retry = useCallback(() => {
    const attempt = attemptRef.current
    if (attempt !== undefined && depsRef.current.ui().newChatStart?.busy !== true) run(attempt)
  }, [run])

  const starter = useMemo(() => ({ start, retry }), [start, retry])
  return enabled ? starter : undefined
}
