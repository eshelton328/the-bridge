// The Toolkit's hand-over from its pending view to the page (R58): while the route loads, ToolkitPending draws the
// home, and what the owner changes there (a search, a chip, an open item, a discussion draft) is kept here, so the
// loaded page starts from it and nothing the owner did is lost. ToolkitPage takes the changes once, at its first
// render, and empties them. Only the two page entries read it.
import { createAppStore } from '../../state/createAppStore.ts'
import type { ToolkitUi } from './types.ts'

type ToolkitViewState = {
  /** What the owner changed in the home's `ui` while the route loaded. */
  pendingUi: Partial<ToolkitUi>
  actions: {
    /** Merges a change the owner made in the pending view. */
    changePending: (change: Partial<ToolkitUi>) => void
    /** Empties the changes once the loaded page has taken them. */
    clearPending: () => void
  }
}

const useToolkitStore = createAppStore<ToolkitViewState>('toolkit', (set) => ({
  pendingUi: {},
  actions: {
    changePending: (change) => {
      set((s) => ({ pendingUi: { ...s.pendingUi, ...change } }), undefined, 'toolkit/changePending')
    },
    clearPending: () => {
      set({ pendingUi: {} }, undefined, 'toolkit/clearPending')
    },
  },
}))

/** What the owner changed in the pending view; empty when nothing. */
export const useToolkitPendingUi = (): Partial<ToolkitUi> => useToolkitStore((s) => s.pendingUi)

/** The Toolkit view actions; a stable reference. */
export const useToolkitActions = (): ToolkitViewState['actions'] => useToolkitStore((s) => s.actions)

/** The store itself, for tests only. */
export const toolkitStore = useToolkitStore
