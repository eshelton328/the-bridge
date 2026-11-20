// A fixed-window rate limit in memory: at most `limit` takes for each
// key in each window of `windowMs`. The server has one owner, so the
// map holds a few keys; a key's window starts again once it has passed.

export type RateLimit = { readonly take: (key: string) => boolean }

export function createRateLimit(limit: number, windowMs: number, now: () => number = Date.now): RateLimit {
  const windows = new Map<string, { start: number; count: number }>()
  return {
    take: (key) => {
      const at = now()
      const window = windows.get(key)
      if (!window || at - window.start >= windowMs) {
        windows.set(key, { start: at, count: 1 })
        return true
      }
      if (window.count >= limit) return false
      window.count += 1
      return true
    },
  }
}
