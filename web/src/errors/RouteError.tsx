// The router's defaultErrorComponent (app/router.ts): every route's render
// and loader errors land here, inside the shell. Retry reloads the route
// with router.invalidate(), which also resets the boundary.
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { ErrorFallback } from './ErrorFallback.tsx'

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <ErrorFallback
      error={error}
      size="page"
      title="This page failed to load"
      onRetry={() => {
        void router.invalidate()
      }}
    />
  )
}
