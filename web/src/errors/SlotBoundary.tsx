// The boundary inside each AppShell slot (list, detail, side): a
// PaneBoundary without the Pane chrome. A throw in one slot shows a small
// fallback with Retry in that slot, and the rail, the tab bar and the other
// slots keep working. It adds no element, so a slot's own child (a detail
// ScrollFrame, which AppShell docks on the keyboard) stays the slot's child.
// It resets when the slot shows other content. Like every boundary it does
// not report: React's root hook (rootErrorOptions.ts) sends what it catches
// to report().
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback.tsx'

export type SlotBoundaryProps = {
  /** What the slot shows, such as the chat id or the view; a new key resets the boundary. */
  contentKey: string
  /**
   * A second action beside Retry, such as Back to the list: a phone view fills the screen with no tab bar, so the
   * fallback gives the owner a way out of it.
   */
  secondary?: { label: string; onClick: () => void } | undefined
  children: ReactNode
}

export function SlotBoundary({ contentKey, secondary, children }: SlotBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={[contentKey]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          size="pane"
          title="This part of the page failed to render"
          onRetry={resetErrorBoundary}
          secondary={secondary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
