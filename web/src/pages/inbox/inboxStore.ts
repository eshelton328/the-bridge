// The Inbox page's view store: which groups Erik opened or closed, and
// what he changed in the shown state: the prompt or remove dialog closed
// and the search text typed. Only InboxPage reads it; the screen gets the values
// as props. A state's own `ui` and `data` are the start, and this store
// holds the changes. The dialog and search changes belong to the shown
// state (`?state=`) and are dropped when another state is shown, so each
// state opens with its own dialog and query.
import { createAppStore } from '../../state/createAppStore.ts'
import type { InboxGroupId } from './types.ts'

/** The `?state=` a change belongs to; undefined is the default state. */
export type InboxStateKey = string | undefined

type InboxEdits = {
  state: InboxStateKey
  promptOpen: boolean | undefined
  removeOpen: boolean | undefined
  query: string | undefined
}

type InboxViewState = {
  groupsOpen: Partial<Record<InboxGroupId, boolean>>
  edits: InboxEdits
  actions: {
    setGroupOpen: (group: InboxGroupId, open: boolean) => void
    setPromptOpen: (state: InboxStateKey, open: boolean) => void
    setRemoveOpen: (state: InboxStateKey, open: boolean) => void
    setQuery: (state: InboxStateKey, query: string) => void
    /** Drops the edits of the last state when another state is shown. */
    showState: (state: InboxStateKey) => void
  }
}

const noEdits = (state: InboxStateKey): InboxEdits => ({
  state,
  promptOpen: undefined,
  removeOpen: undefined,
  query: undefined,
})

/** The edits of `state`: the stored ones when they belong to it, else none. */
const editsOf = (edits: InboxEdits, state: InboxStateKey): InboxEdits =>
  edits.state === state ? edits : noEdits(state)

const useInboxStore = createAppStore<InboxViewState>('inbox', (set) => ({
  groupsOpen: {},
  edits: noEdits(undefined),
  actions: {
    setGroupOpen: (group, open) => {
      set((s) => ({ groupsOpen: { ...s.groupsOpen, [group]: open } }), undefined, 'inbox/setGroupOpen')
    },
    setPromptOpen: (state, open) => {
      set((s) => ({ edits: { ...editsOf(s.edits, state), promptOpen: open } }), undefined, 'inbox/setPromptOpen')
    },
    setRemoveOpen: (state, open) => {
      set((s) => ({ edits: { ...editsOf(s.edits, state), removeOpen: open } }), undefined, 'inbox/setRemoveOpen')
    },
    setQuery: (state, query) => {
      set((s) => ({ edits: { ...editsOf(s.edits, state), query } }), undefined, 'inbox/setQuery')
    },
    showState: (state) => {
      set((s) => ({ edits: editsOf(s.edits, state) }), undefined, 'inbox/showState')
    },
  },
}))

/** The groups Erik opened or closed, over the state's own. */
export const useInboxGroupsOpen = (): InboxViewState['groupsOpen'] => useInboxStore((s) => s.groupsOpen)

/** Whether Erik opened or closed the prompt dialog in `state`; undefined keeps the state's own. */
export const useInboxPromptOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.promptOpen : undefined))

/** Whether Erik opened or closed the remove dialog in `state`; undefined keeps the state's own. */
export const useInboxRemoveOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.removeOpen : undefined))

/** The search text Erik typed in `state`; undefined keeps the state's own query. */
export const useInboxQuery = (state: InboxStateKey): string | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.query : undefined))

/** The Inbox view actions; a stable reference. */
export const useInboxActions = (): InboxViewState['actions'] => useInboxStore((s) => s.actions)

/** The store itself, for tests only. */
export const inboxStore = useInboxStore
