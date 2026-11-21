// The Inbox page's view store: which groups the owner opened or closed, and
// what he changed in the shown state: the open item closed with Back (on a
// tablet or phone), the prompt or remove dialog closed, the search text
// typed, and the rest of its `ui` (menus, sort, filters, snoozed items). Only InboxPage reads it; the screen gets the values
// as props. A state's own `ui` and `data` are the start, and this store
// holds the changes. The dialog and search changes belong to the shown
// state (`?state=`) and are dropped when another state is shown, so each
// state opens with its own dialog and query.
import { createAppStore } from '../../state/createAppStore.ts'
import type { InboxDraftField, InboxDrafts, InboxGroupId, InboxUi } from './types.ts'

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

/** The rest of what the owner changed in the shown state's `ui`: menus, the sort, the filters, snoozed items. */
type InboxUiEdits = { state: InboxStateKey; ui: Partial<InboxUi> }

/** What the owner typed in the open item's fields. It outlives the page, so a visit to another page keeps it. */
type InboxTyped = { item: string | undefined; values: InboxDrafts['values'] }

type InboxViewState = {
  groupsOpen: Partial<Record<InboxGroupId, boolean>>
  typed: InboxTyped
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
    /** Sets one field's text for `item`; another item starts empty. */
    setDraft: (item: string | undefined, field: InboxDraftField, value: string) => void
    /**
     * Sends `text` to the discussion of `item`. It resolves once the message is sent and rejects when the send fails.
     * The page has no discussion server yet, so the message goes nowhere and the send resolves.
     */
    send: (item: string | undefined, text: string) => Promise<void>
    /**
     * After a sent message: adds `text` to the state's sent messages (over `sent`, the state's own), and empties the
     * discussion's draft only while it is still `item`'s and still holds `text`, so a newer draft is kept (audit L-3).
     */
    markSent: (state: InboxStateKey, sent: readonly string[], item: string | undefined, text: string) => void
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
  typed: { item: undefined, values: {} },
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
    setDraft: (item, field, value) => {
      set(
        (s) => ({ typed: { item, values: { ...(s.typed.item === item ? s.typed.values : {}), [field]: value } } }),
        undefined,
        'inbox/setDraft',
      )
    },
    send: () => Promise.resolve(),
    markSent: (state, sent, item, text) => {
      set(
        (s) => {
          const kept = s.typed.item !== item || s.typed.values.discussion !== text
          // A send that ends after another state shows leaves that state's edits as they are (Codex review of #265).
          const shown = s.uiEdits.state === state
          return {
            uiEdits: shown
              ? { state, ui: { ...s.uiEdits.ui, sent: [...(s.uiEdits.ui.sent ?? sent), text] } }
              : s.uiEdits,
            typed: kept ? s.typed : { item, values: { ...s.typed.values, discussion: '' } },
          }
        },
        undefined,
        'inbox/markSent',
      )
    },
  },
}))

/** The groups the owner opened or closed, over the state's own. */
export const useInboxGroupsOpen = (): InboxViewState['groupsOpen'] => useInboxStore((s) => s.groupsOpen)

/** Whether the state's open item is still open in `state`; false after Back, undefined keeps the state's own. */
export const useInboxItemOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.itemOpen : undefined))

/** Whether the owner opened or closed the prompt dialog in `state`; undefined keeps the state's own. */
export const useInboxPromptOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.promptOpen : undefined))

/** Whether the owner opened or closed the remove dialog in `state`; undefined keeps the state's own. */
export const useInboxRemoveOpen = (state: InboxStateKey): boolean | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.removeOpen : undefined))

/** The search text the owner typed in `state`; undefined keeps the state's own query. */
export const useInboxQuery = (state: InboxStateKey): string | undefined =>
  useInboxStore((s) => (s.edits.state === state ? s.edits.query : undefined))

/** What the owner changed in `state`'s `ui` besides the dialogs and Back; empty keeps the state's own. */
export const useInboxUi = (state: InboxStateKey): Partial<InboxUi> =>
  useInboxStore((s) => (s.uiEdits.state === state ? s.uiEdits.ui : noUi))

const noDrafts: InboxDrafts['values'] = {}

/** What the owner typed in `item`'s fields; empty for another item. */
export const useInboxDrafts = (item: string | undefined): InboxDrafts['values'] =>
  useInboxStore((s) => (s.typed.item === item ? s.typed.values : noDrafts))

/** The Inbox view actions; a stable reference. */
export const useInboxActions = (): InboxViewState['actions'] => useInboxStore((s) => s.actions)

/** The store itself, for tests only. */
export const inboxStore = useInboxStore
