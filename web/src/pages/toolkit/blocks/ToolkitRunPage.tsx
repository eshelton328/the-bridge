// An open run on a tablet or phone, as M10's note says ("Tap a run to see it
// and open its session"): a page of its own in the shared `DetailFrame`
// (d-107), with the back row (Back to the Activity view) at the top and the
// run under it: `ToolkitRunHeader` with no close, then `ToolkitRunDetail`.
// No frame draws it yet; it shows what D12's panel shows. Props only.
import { BackRow, Stack } from '@eshelton328/component-library-1701'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitRun } from '../types.ts'
import { ToolkitRunDetail } from './ToolkitRunDetail.tsx'
import { ToolkitRunHeader } from './ToolkitRunHeader.tsx'

export type ToolkitRunPageProps = {
  run: ToolkitRun
  layout: Viewport
  /** What Back goes back to, such as "Activity". */
  backLabel: string
  status: string
  openSession: string
  onBack?: (() => void) | undefined
}

export function ToolkitRunPage({ run, layout, backLabel, status, openSession, onBack }: ToolkitRunPageProps) {
  return (
    <DetailFrame layout={layout} back={<BackRow label={backLabel} onBack={onBack} />}>
      <article aria-label={run.name}>
        <Stack gap="12">
          <ToolkitRunHeader run={run} status={status} />
          <ToolkitRunDetail run={run} openSession={openSession} />
        </Stack>
      </article>
    </DetailFrame>
  )
}
