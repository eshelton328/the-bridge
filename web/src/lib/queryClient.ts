// The app's one TanStack Query client: what a page entry or loader uses to
// read the server. Screens and blocks never import it (props-only).
// A query that fails retries at most twice, and only when a later try can
// fix it: a network error (fetch's TypeError), a 5xx, a 408 or a 429. A query or mutation that fails
// for good goes to the error sink, which errors/globalHandlers.ts points at
// report() (lib may not import errors/), except a query whose meta says its
// misses are expected (`expected: true`, the live reads, d-117).
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

/** Where a failed query or mutation goes, and which of the two it was. */
export type QueryErrorSink = (error: unknown, source: 'query' | 'mutation') => void

let sink: QueryErrorSink | undefined

/** Sends each query and mutation that fails for good to `next`; returns the removal. */
export function setQueryErrorSink(next: QueryErrorSink): () => void {
  sink = next
  return () => {
    if (sink === next) sink = undefined
  }
}

const maxRetries = 2

/** The HTTP status an error carries as a numeric `status`, if any. */
function httpStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined
}

/**
 * Whether a query tries again after `failureCount` failures, the last one `error` (audit W-7): only a network error
 * or a status a later try can fix. Any other error, such as an answer that breaks the contract, fails at once.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= maxRetries) return false
  if (error instanceof TypeError) return true
  const status = httpStatus(error)
  if (status === undefined) return false
  return status >= 500 || status === 408 || status === 429
}

/** A client with the app's error hooks and retry; `queryClient` is the app's one, tests make their own. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A query that marks its misses as expected shows them on its page instead (d-117).
        if (query.meta?.expected === true) return
        sink?.(error, 'query')
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        sink?.(error, 'mutation')
      },
    }),
    defaultOptions: { queries: { retry: shouldRetry } },
  })
}

export const queryClient = createQueryClient()
