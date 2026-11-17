// The Inbox page's view store: which groups Erik opened or closed, and
// what he changed in the shown state: the open item closed with Back (on a
// tablet or phone), the prompt or remove dialog closed, the search text
// typed, and the rest of its `ui` (menus, sort, filters, snoozed items). Only InboxPage reads it; the screen gets the values
// as props. A state's own `ui` and `data` are the start, and this store
// holds the changes. The dialog and search changes belong to the shown
// state (`?state=`) and are dropped when another state is shown, so each
// state opens with its own dialog and query.
import { createAppStore } from '../../state/createAppStore.ts'
import type { InboxGroupId, InboxUi } from './types.ts'

/** The `?state=` a change belongs to; undefined is the default state. */
export type InboxStateKey = string | undefined

type InboxEdits = {
  state: InboxStateKey
  /** False once Back closed the state's open item, so the list shows. */
  itemOpen: boolean | undefined
  promptOpen: boolean | undefined
  removeOpen: boolean | undefined
  query: string | undefined
}

/** The rest of what Erik changed in the shown state's `ui`: menus, the sort, the filters, snoozed items. */
type InboxUiEdits = { state: InboxStateKey; ui: Partial<InboxUi> }

type InboxViewState = {
  groupsOpen: Partial<Record<InboxGroupId, boolean>>
  edits: InboxEdits
  uiEdits: InboxUiEdits
  actions: {
    setGroupOpen: (group: InboxGroupId, open: boolean) => void
    setItemOpen: (state: InboxStateKey, open: boolean) => void
    setPromptOpen: (state: InboxStateKey, open: boolean) => void
    setRemoveOpen: (state: InboxStateKey, open: boolean) => void
    setQuery: (state: InboxStateKey, query: string) => void
    /** Merges a change into the state's `ui` edits. */
    setUi: (state: InboxStateKey, change: Partial<InboxUi>) => void
    /** Drops the edits of the last state when another state is shown. */
    showState: (state: InboxStateKey) => void
  }
}

const noEdits = (state: InboxStateKey): InboxEdits => ({
  state,
  itemOpen: undefined,
  promptOpen: undefined,
  removeOpen: undefined,
  query: undefined,
})

/** The edits of `state`: the stored ones when they belong to it, else none. */
const editsOf = (edits: InboxEdits, state: InboxStateKey): InboxEdits =>
  edits.state === state ? edits : noEdits(state)

const noUi: Partial<InboxUi> = {}

const useInboxStore = createAppStore<InboxViewState>('inbox', (set) => ({
  groupsOpen: {},
  edits: noEdits(undefined),
  uiEdits: { state: undefined, ui: {} },
  actions: {
    setGroupOpen: (group, open) => {
      set((s) => ({ groupsOpen: { ...s.groupsOpen, [group]: open } }), undefined, 'inbox/setGroupOpen')
    },
    setItemOpen: (state, open) => {
      set((s) => ({ edits: { ...editsOf(s.edits, state), itemOpen: open } }), undefined, 'inbox/setItemOpen')
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
    setUi: (state, change) => {
      set(
        (s) => ({ uiEdits: { state, ui: { ...(s.uiEdits.state === state ? s.uiEdits.ui : {}), ...change } } }),
        undefined,
        'inbox/setUi',
      )
    },
    showState: (state) => {
      set(
        (s) => ({
          edits: editsOf(s.edits, state),
          uiEdits: s.uiEdits.state === state ? s.uiEdits : { state, ui: {} },
        }),
        undefined,
        'inbox/showState',
      )
    },
  },
}))

/** The groups Erik opened or closed, over the state's own. */
export const useInboxGroupsOpen = (): InboxViewState['groupsOpen'] => useInboxStore((s) => s.groupsOpen)

/** Whether the state's open item is still open in `state`; false after Back, undefined keeps the state's own. */
export const useInboxItemOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.itemOpen : undefined))

/** Whether Erik opened or closed the prompt dialog in `state`; undefined keeps the state's own. */
export const useInboxPromptOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.promptOpen : undefined))

/** Whether Erik opened or closed the remove dialog in `state`; undefined keeps the state's own. */
export const useInboxRemoveOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.removeOpen : undefined))

/** The search text Erik typed in `state`; undefined keeps the state's own query. */
export const useInboxQuery = (state: InboxStateKey): string | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.query : undefined))

/** What Erik changed in `state`'s `ui` besides the dialogs and Back; empty keeps the state's own. */
export const useInboxUi = (state: InboxStateKey): Partial<InboxUi> =>
  useInboxStore((s) => (s.uiEdits.state === state ? s.uiEdits.ui : noUi))

/** The Inbox view actions; a stable reference. */
export const useInboxActions = (): InboxViewState['actions'] => useInboxStore((s) => s.actions)

/** The store itself, for tests only. */
export const inboxStore = useInboxStore
