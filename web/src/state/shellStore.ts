// The app shell's client state, such as whether the sidebar is open. Read
// it with the hooks below, from app/ or a page entry only; a screen gets
// the value as a prop.
import { createAppStore } from './createAppStore.ts'

type ShellState = {
  sidebarOpen: boolean
  actions: {
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
  }
}

const useShellStore = createAppStore<ShellState>('shell', (set) => ({
  sidebarOpen: true,
  actions: {
    toggleSidebar: () => {
      set((s) => ({ sidebarOpen: !s.sidebarOpen }), undefined, 'shell/toggleSidebar')
    },
    setSidebarOpen: (open) => {
      set({ sidebarOpen: open }, undefined, 'shell/setSidebarOpen')
    },
  },
}))

/**
 * Whether the sidebar is open. No screen has a sidebar yet; `@public`
 * tells knip the export is the store's API.
 * @public
 */
export const useShellSidebarOpen = (): boolean => useShellStore((s) => s.sidebarOpen)

/**
 * The shell's actions; a stable reference.
 * @public
 */
export const useShellActions = (): ShellState['actions'] => useShellStore((s) => s.actions)

/** The store itself, for tests only: `shellStore.getState()`. */
export const shellStore = useShellStore
