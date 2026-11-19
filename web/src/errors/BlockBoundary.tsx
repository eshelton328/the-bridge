// The boundary around a block that renders rich or untrusted content:
// Markdown, code, the map, charts. Never around a row, a button or an
// avatar. Screens and blocks may use it.
import { type ReactNode, useId } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback.tsx'

export type BlockBoundaryProps = {
  /** What the block shows; a new key resets the boundary. */
  contentKey?: string | undefined
  children: ReactNode
}

export function BlockBoundary({ contentKey = '', children }: BlockBoundaryProps) {
  const boundaryId = useId()
  return (
    <ErrorBoundary
      resetKeys={[contentKey]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          size="inline"
          title="This part failed to render."
          retryScope={boundaryId}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
