// The Inbox page's view store: which groups Erik opened or closed. Only
// InboxPage reads it; the screen gets the values as props. A state's own
// `ui.groupsOpen` is the start, and this store holds the changes.
import { createAppStore } from '../../state/createAppStore.ts'
import type { InboxGroupId } from './types.ts'

type InboxViewState = {
  groupsOpen: Partial<Record<InboxGroupId, boolean>>
  actions: {
    setGroupOpen: (group: InboxGroupId, open: boolean) => void
  }
}

const useInboxStore = createAppStore<InboxViewState>('inbox', (set) => ({
  groupsOpen: {},
  actions: {
    setGroupOpen: (group, open) => {
      set((s) => ({ groupsOpen: { ...s.groupsOpen, [group]: open } }), undefined, 'inbox/setGroupOpen')
    },
  },
}))

/** The groups Erik opened or closed, over the state's own. */
export const useInboxGroupsOpen = (): InboxViewState['groupsOpen'] => useInboxStore((s) => s.groupsOpen)

/** The Inbox view actions; a stable reference. */
export const useInboxActions = (): InboxViewState['actions'] => useInboxStore((s) => s.actions)

/** The store itself, for tests only. */
export const inboxStore = useInboxStore
