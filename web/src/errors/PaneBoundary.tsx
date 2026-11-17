// The boundary inside each Workbench pane, under the pane header, so the
// title stays and the other panes keep working. It resets when the pane
// shows another chat. Render panes through PaneSlot, which adds it.
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback.tsx'

export type PaneBoundaryProps = {
  /** What the pane shows, such as the chat id; a new key resets the boundary. */
  contentKey: string
  /** Closes the pane from the fallback. */
  onClosePane?: (() => void) | undefined
  children: ReactNode
}

export function PaneBoundary({ contentKey, onClosePane, children }: PaneBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={[contentKey]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          size="pane"
          title="This pane failed to render"
          onRetry={resetErrorBoundary}
          secondary={onClosePane === undefined ? undefined : { label: 'Close pane', onClick: onClosePane }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
