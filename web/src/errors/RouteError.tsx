// The router's defaultErrorComponent (app/router.ts): every route's render
// and loader errors land here, in place of the page and its rail or tab
// bar. Retry reloads the route with router.invalidate(), which also resets
// the boundary; Go to Inbox leaves the broken page (audit W-10).
import { useRouter, useRouterState, type ErrorComponentProps } from '@tanstack/react-router'
import { ErrorFallback } from './ErrorFallback.tsx'

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <ErrorFallback
      error={error}
      size="page"
      title="This page failed to load"
      // A retry that fails mounts a new RouteError, so the page's path names its retries.
      retryScope={`route:${pathname}`}
      onRetry={() => {
        void router.invalidate()
      }}
      secondary={
        pathname === '/inbox'
          ? undefined
          : {
              label: 'Go to Inbox',
              onClick: () => {
                void router.navigate({ to: '/inbox' })
              },
            }
      }
    />
  )
}
