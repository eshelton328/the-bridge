// Stops a person looping on an error that will not clear: after two
// retries within ten seconds in one boundary, that boundary's fallback
// offers Reload app instead. The record is kept here, by the boundary's
// scope, because a retry that fails mounts a new fallback; each boundary
// has its own, so retries in one never block Retry in another (audit W-10).

const windowMs = 10_000
const maxRetries = 2
let retries = new Map<string, readonly number[]>()

const recent = (scope: string, now: number) => (retries.get(scope) ?? []).filter((t) => now - t < windowMs)

/** Notes a retry click in the boundary `scope`. */
export function recordRetry(scope: string, now: number = Date.now()): void {
  retries.set(scope, [...recent(scope, now), now])
}

/** Whether the retries in `scope` in the last ten seconds used up its allowance. */
export function retriesExhausted(scope: string, now: number = Date.now()): boolean {
  return recent(scope, now).length >= maxRetries
}

/** Forgets every retry; for tests. */
export function resetRetries(): void {
  retries = new Map()
}
