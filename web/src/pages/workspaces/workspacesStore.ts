// The Workspaces page's view store: what Erik changed in the shown state's
// `ui`, any of its fields, such as the focused pane, an open menu or the
// sizes of the split's handles (`splitSizes`). Only WorkspacesPage reads
// it; the screen gets the values as props. A state's own `ui` is the start,
// and this store holds the changes, so a visit to another page keeps them.
// The changes belong to the shown state (`?state=`) and are dropped when
// another state is shown, as each state names its own panes.
import { createAppStore } from '../../state/createAppStore.ts'
import type { WorkspacesUi } from './types.ts'

/** The `?state=` a change belongs to; undefined is the default state. */
export type WorkspacesStateKey = string | undefined

type WorkspacesUiEdits = { state: WorkspacesStateKey; ui: Partial<WorkspacesUi> }

type WorkspacesViewState = {
  uiEdits: WorkspacesUiEdits
  actions: {
    /** Merges a change into the state's `ui` edits. */
    setUi: (state: WorkspacesStateKey, change: Partial<WorkspacesUi>) => void
    /** Drops the edits of the last state when another state is shown. */
    showState: (state: WorkspacesStateKey) => void
  }
}

const noUi: Partial<WorkspacesUi> = {}

const useWorkspacesStore = createAppStore<WorkspacesViewState>('workspaces', (set) => ({
  uiEdits: { state: undefined, ui: noUi },
  actions: {
    setUi: (state, change) => {
      set(
        (s) => ({ uiEdits: { state, ui: { ...(s.uiEdits.state === state ? s.uiEdits.ui : {}), ...change } } }),
        undefined,
        'workspaces/setUi',
      )
    },
    showState: (state) => {
      set(
        (s) => ({ uiEdits: s.uiEdits.state === state ? s.uiEdits : { state, ui: noUi } }),
        undefined,
        'workspaces/showState',
      )
    },
  },
}))

/** What Erik changed in `state`'s `ui`; empty keeps the state's own. */
export const useWorkspacesUi = (state: WorkspacesStateKey): Partial<WorkspacesUi> =>
  useWorkspacesStore((s) => (s.uiEdits.state === state ? s.uiEdits.ui : noUi))

/** The Workspaces view actions; a stable reference. */
export const useWorkspacesActions = (): WorkspacesViewState['actions'] => useWorkspacesStore((s) => s.actions)

/** The store itself, for tests only. */
export const workspacesStore = useWorkspacesStore
