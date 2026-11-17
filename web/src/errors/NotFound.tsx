// The router's defaultNotFoundComponent: an unknown address, or a loader
// that throws notFound(), such as an unknown ?state=. Figma has no
// not-found screen; this copy is Claude's, for Erik's review.
import { Button, CompassIcon } from '@eshelton328/component-library-1701'
import { useRouter } from '@tanstack/react-router'
import { ErrorState } from './ErrorState.tsx'

export function NotFound() {
  const router = useRouter()
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
