// The boundary at the root, outside the router: the last line before a
// blank page. It offers Reload app only; the root hooks report the error.
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback.tsx'

export function AppBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <ErrorFallback error={error} size="page" title="The Bridge hit an error" retryScope="app" />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
