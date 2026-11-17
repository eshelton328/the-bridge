// Stops a person looping on an error that will not clear: after two
// retries within ten seconds, any fallback offers Reload app instead. The
// record is module-wide because a retry that fails mounts a new fallback.

const windowMs = 10_000
const maxRetries = 2
let retries: readonly number[] = []

const recent = (now: number) => retries.filter((t) => now - t < windowMs)

/** Notes a retry click. */
export function recordRetry(now: number = Date.now()): void {
  retries = [...recent(now), now]
}

/** Whether the retries in the last ten seconds used up the allowance. */
export function retriesExhausted(now: number = Date.now()): boolean {
  return recent(now).length >= maxRetries
}

/** Forgets every retry; for tests. */
export function resetRetries(): void {
  retries = []
}
