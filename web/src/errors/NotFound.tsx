// The router's defaultNotFoundComponent: an unknown address, or a loader
// that throws notFound(), such as an unknown ?state=. A loader whose data
// source is not built yet (?source=mock-api, lib/dataSource.ts) throws
// notFound() with that miss, and this shows "not built yet" with a way
// back to the fixtures. Figma has no not-found screen; this copy is
// Claude's, for Erik's review.
import { Button, CompassIcon } from '@eshelton328/component-library-1701'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { isNotBuilt } from '../lib/dataSource.ts'
import { searchHref } from '../lib/searchHref.ts'
import { ErrorState } from './ErrorState.tsx'

/** The router passes `notFound({ data })`'s data; `NotFoundRouteProps` would make the router's type circular. */
export function NotFound({ data }: { data?: unknown }) {
  const router = useRouter()
  const location = useRouterState({ select: (s) => s.location })
  if (isNotBuilt(data))
    return (
      <ErrorState
        size="page"
        tone="neutral"
        icon={<CompassIcon />}
        title="Data source not built yet"
        description={`The ${data.source} source is not built yet. Fixtures is the only source that loads today.`}
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              void router.navigate({ href: searchHref(location.pathname, location.searchStr, { source: undefined }) })
            }}
          >
            Use fixtures
          </Button>
        }
      />
    )
  return (
    <ErrorState
      size="page"
      tone="neutral"
      icon={<CompassIcon />}
      title="Page not found"
      description="This address does not match a page of the Bridge."
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            void router.navigate({ to: '/inbox' })
          }}
        >
          Go to Inbox
        </Button>
      }
    />
  )
}
