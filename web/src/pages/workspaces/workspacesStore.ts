// The Workspaces page's view store: what the owner changed in the shown state's
// `ui`, any of its fields, such as the focused pane, an open menu or the
// sizes of the split's handles (`splitSizes`). Only WorkspacesPage reads
// it; the screen gets the values as props. A state's own `ui` is the start,
// and this store holds the changes, so a visit to another page keeps them.
// The changes belong to the shown state (`?state=`) and are dropped when
// another state is shown, as each state names its own panes. `send` is the
// page's send of a chat's message: the composer keeps its draft until it
// resolves, and a rejected send keeps it. It also keeps each live chat's
// pane as the page last saw it (`seenPanes`), so when a chat's ID changes on
// its pane (/clear, W5) `followPanes` moves the changes from the old ID to
// the new one (paneFollow.ts), even after a visit to another page.
import { createAppStore } from '../../state/createAppStore.ts'
import type { DraftBook } from './blocks/draftBook.ts'
import { nextSeen, paneMoves, withMovedChats } from './paneFollow.ts'
import type { WorkspacesUi } from './types.ts'

/** The `?state=` a change belongs to; undefined is the default state. */
export type WorkspacesStateKey = string | undefined

type WorkspacesUiEdits = { state: WorkspacesStateKey; ui: Partial<WorkspacesUi> }

type WorkspacesDrafts = { state: WorkspacesStateKey; book: DraftBook } | undefined

type WorkspacesSeenPanes = { state: WorkspacesStateKey; panes: ReadonlyMap<string, string> } | undefined

type WorkspacesViewState = {
  uiEdits: WorkspacesUiEdits
  drafts: WorkspacesDrafts
  seenPanes: WorkspacesSeenPanes
  actions: {
    /** Merges a change into the state's `ui` edits. */
    setUi: (state: WorkspacesStateKey, change: Partial<WorkspacesUi>) => void
    /** Keeps `book` as the composer drafts of `state` (workspacesDraftBook). */
    keepDrafts: (state: WorkspacesStateKey, book: DraftBook) => void
    /**
     * Takes the live chats' panes the page shows now (`chatPanesOf`): a chat whose ID changed on its pane since the
     * last list takes the state's `ui` edits made for its old ID (`withMovedChats`).
     */
    followPanes: (state: WorkspacesStateKey, panes: ReadonlyMap<string, string>) => void
    /** Drops the edits and drafts of the last state when another state is shown. */
    showState: (state: WorkspacesStateKey) => void
    /**
     * Sends `text` to the chat `chat`. It resolves once the message is sent and rejects when the send fails. The page
     * has no chat server yet, so the message goes nowhere and the send resolves.
     */
    send: (chat: string, text: string) => Promise<void>
  }
}

const noUi: Partial<WorkspacesUi> = {}

const useWorkspacesStore = createAppStore<WorkspacesViewState>('workspaces', (set) => ({
  uiEdits: { state: undefined, ui: noUi },
  drafts: undefined,
  seenPanes: undefined,
  actions: {
    setUi: (state, change) => {
      set(
        (s) => ({ uiEdits: { state, ui: { ...(s.uiEdits.state === state ? s.uiEdits.ui : {}), ...change } } }),
        undefined,
        'workspaces/setUi',
      )
    },
    keepDrafts: (state, book) => {
      set({ drafts: { state, book } }, undefined, 'workspaces/keepDrafts')
    },
    followPanes: (state, panes) => {
      set(
        (s) => {
          const before =
            s.seenPanes !== undefined && s.seenPanes.state === state ? s.seenPanes.panes : new Map<string, string>()
          const moves = paneMoves(before, panes)
          const uiEdits =
            moves.size > 0 && s.uiEdits.state === state ? { state, ui: withMovedChats(s.uiEdits.ui, moves) } : s.uiEdits
          return { uiEdits, seenPanes: { state, panes: nextSeen(before, panes) } }
        },
        undefined,
        'workspaces/followPanes',
      )
    },
    showState: (state) => {
      set(
        (s) => ({
          uiEdits: s.uiEdits.state === state ? s.uiEdits : { state, ui: noUi },
          drafts: s.drafts?.state === state ? s.drafts : undefined,
          seenPanes: s.seenPanes?.state === state ? s.seenPanes : undefined,
        }),
        undefined,
        'workspaces/showState',
      )
    },
    send: () => Promise.resolve(),
  },
}))

/** What the owner changed in `state`'s `ui`; empty keeps the state's own. */
export const useWorkspacesUi = (state: WorkspacesStateKey): Partial<WorkspacesUi> =>
  useWorkspacesStore((s) => (s.uiEdits.state === state ? s.uiEdits.ui : noUi))

/**
 * The composer drafts of `state`, one book for every mount of the page, made with `make` the first time: a send that
 * ends after the owner left the page and came back clears the draft his composer shows. Not subscribed, so a keystroke
 * renders no reader.
 */
export const workspacesDraftBook = (state: WorkspacesStateKey, make: () => DraftBook): DraftBook => {
  const { drafts, actions } = useWorkspacesStore.getState()
  if (drafts !== undefined && drafts.state === state) return drafts.book
  const book = make()
  actions.keepDrafts(state, book)
  return book
}

const noPanes: ReadonlyMap<string, string> = new Map()

/** The live chats' panes as the page last took them for `state` (`followPanes`); none before the first list. */
export const useSeenPanes = (state: WorkspacesStateKey): ReadonlyMap<string, string> =>
  useWorkspacesStore((s) => (s.seenPanes !== undefined && s.seenPanes.state === state ? s.seenPanes.panes : noPanes))

/** The Workspaces view actions; a stable reference. */
export const useWorkspacesActions = (): WorkspacesViewState['actions'] => useWorkspacesStore((s) => s.actions)

/** The store itself, for tests only. */
export const workspacesStore = useWorkspacesStore
