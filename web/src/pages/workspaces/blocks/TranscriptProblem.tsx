// The quiet line under a live chat's transcript when its read or its updates
// failed (slice 3b, d-115), such as "Transcript not live — unreachable" or
// "Transcript updates lost — connecting again", with Retry, which reads the
// transcript again. The library has no quiet inline notice (LIBRARY_GAPS.md
// "Not live yet"): the closest part is ErrorState's `inline` row in the
// neutral tone, an alert, as LiveNotice draws. Props only.
import { Button } from '@eshelton328/component-library-1701'
import { ErrorState } from '../../../errors/ErrorState.tsx'

export type TranscriptProblemProps = {
  /** What failed, with no text from the server. */
  text: string
  /** Reads the transcript again; no Retry when not set. */
  onRetry?: (() => void) | undefined
}

export function TranscriptProblem({ text, onRetry }: TranscriptProblemProps) {
  return (
    <ErrorState
      size="inline"
      tone="neutral"
      title={text}
      level={3}
      actions={
        onRetry === undefined ? undefined : (
          <Button size="sm" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    />
  )
}
