// The only way to make a global store (rule R7 in state/AGENTS.md): the
// curried create<T>()(), the devtools middleware named `bridge/<name>`,
// and a reset in the registry. State and an `actions` object that is made
// once and never replaced, so useXActions() is a stable reference.
import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { registerReset } from './resetStores.ts'

/** A store's state: its values plus one `actions` object. */
export type AppState = { actions: object }

type DevtoolsStore<T> = UseBoundStore<StoreApi<T>>

/**
 * Makes a global store with devtools and registers its reset. `name` names
 * it in the Redux DevTools as `bridge/<name>`; pass an action name as the
 * third argument of `set`, such as `'shell/toggleSidebar'`.
 */
export function createAppStore<T extends AppState>(
  name: string,
  initializer: StateCreator<T, [['zustand/devtools', never]]>,
): DevtoolsStore<T> {
  const useStore = create<T>()(devtools(initializer, { name: `bridge/${name}` }))
  registerReset(() => {
    useStore.setState(useStore.getInitialState(), true)
  })
  return useStore
}
