// The fallback every boundary renders: ErrorState with Retry, or Reload
// app once retries are used up, and an optional second action such as
// Close pane. The dev build adds the message and stack.
import { Button } from '@eshelton328/component-library-1701'
import { getErrorMessage } from 'react-error-boundary'
import { toError } from './appError.ts'
import { ErrorState, type ErrorStateProps } from './ErrorState.tsx'
import { recordRetry, retriesExhausted } from './retryGuard.ts'

export type ErrorFallbackProps = {
  error: unknown
  size: NonNullable<ErrorStateProps['size']>
  title: string
  /** Tries again: resets the boundary or reloads the route. Without it the only action is Reload app. */
  onRetry?: (() => void) | undefined
  /** A second action, such as Close pane. */
  secondary?: { label: string; onClick: () => void } | undefined
}

const reload = () => {
  window.location.reload()
}

function devDetails(error: unknown): string | undefined {
  if (!import.meta.env.DEV) return undefined
  const e = toError(error)
  return [getErrorMessage(error) ?? e.message, e.stack].filter((x) => x !== undefined && x !== '').join('\n\n')
}

export function ErrorFallback({ error, size, title, onRetry, secondary }: ErrorFallbackProps) {
  const canRetry = onRetry !== undefined && !retriesExhausted()
  const retry = () => {
    recordRetry()
    onRetry?.()
  }
  return (
    <ErrorState
      size={size}
      tone="danger"
      title={title}
      description={canRetry ? 'Try again. If it keeps failing, reload the app.' : 'Reload the app to continue.'}
      details={devDetails(error)}
      actions={
        <>
          {canRetry ? (
            <Button size="sm" variant="primary" onClick={retry}>
              Retry
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={reload}>
              Reload app
            </Button>
          )}
          {secondary === undefined ? null : (
            <Button size="sm" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </>
      }
    />
  )
}
