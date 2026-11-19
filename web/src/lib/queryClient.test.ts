import { afterEach, describe, expect, it } from 'vitest'
import { createQueryClient, type QueryErrorSink, setQueryErrorSink, shouldRetry } from './queryClient.ts'

/** An error with an HTTP status, as a fetcher throws for an answer that is not ok. */
const httpError = (status: number) => Object.assign(new Error(`HTTP ${String(status)}`), { status })

let removeSink: (() => void) | undefined

afterEach(() => {
  removeSink?.()
  removeSink = undefined
})

/** Runs a query that always throws `error` with no wait between tries; returns how many times it ran. */
async function tries(error: unknown): Promise<number> {
  const client = createQueryClient()
  let calls = 0
  await client
    .query({
      queryKey: ['tries', calls],
      queryFn: () => {
        calls += 1
        return Promise.reject(error instanceof Error ? error : new Error('not an Error'))
      },
      retryDelay: 0,
      retry: (count, thrown) => shouldRetry(count, thrown),
    })
    .catch(() => undefined)
  return calls
}

describe('shouldRetry (audit W-7)', () => {
  it('retries a server error, a network error, a 408 and a 429 at most twice', async () => {
    expect(await tries(httpError(503))).toBe(3)
    expect(await tries(new TypeError('Failed to fetch'))).toBe(3)
    expect(await tries(httpError(408))).toBe(3)
    expect(await tries(httpError(429))).toBe(3)
  })

  it('never retries another 4xx', async () => {
    expect(await tries(httpError(400))).toBe(1)
    expect(await tries(httpError(404))).toBe(1)
    expect(await tries(httpError(403))).toBe(1)
  })

  it('never retries an error with no status, such as an answer that breaks the contract', async () => {
    expect(await tries(new Error('the answer does not match the contract'))).toBe(1)
  })

  it('is the default retry of the app client', () => {
    expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(shouldRetry)
  })
})

describe('the query error sink (audit W-7)', () => {
  it('gets each query and mutation that fails for good, with which it was', async () => {
    const seen: Parameters<QueryErrorSink>[] = []
    removeSink = setQueryErrorSink((error, source) => {
      seen.push([error, source])
    })
    const client = createQueryClient()
    const queryError = httpError(404)
    await client.query({ queryKey: ['sink'], queryFn: () => Promise.reject(queryError) }).catch(() => undefined)
    const mutationError = new Error('save failed')
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(mutationError) })
      .execute(undefined)
      .catch(() => undefined)
    expect(seen).toEqual([
      [queryError, 'query'],
      [mutationError, 'mutation'],
    ])
  })
})
