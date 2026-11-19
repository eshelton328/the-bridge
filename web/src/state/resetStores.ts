// The reset registry. createAppStore registers each store here, so a test
// or a story can put every store back to its first state with one call
// (Zustand guide "How to reset state"; no module mocking, which Vitest
// browser mode does not do well).

const resets = new Set<() => void>()

/** Adds a store's reset. createAppStore calls it, and a page file that keeps store state in storage (draftStorage.ts). */
export function registerReset(reset: () => void): void {
  resets.add(reset)
}

/** Puts every store made with createAppStore back to its first state. */
export function resetAllStores(): void {
  for (const reset of resets) reset()
}
