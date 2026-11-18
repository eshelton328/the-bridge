// An open run beside the Activity view on the desktop (Figma `side panel ·
// run`, D12 445:465): `ToolkitRunHeader` with close at the top and
// `ToolkitRunDetail` under it, in the AppShell's wide side slot. Figma lays a
// 440 px panel over the view; the slot is 420 and the view beside it
// narrows (LIBRARY_GAPS.md, Run side panel). Only the run scrolls under its
// header (d-107, ScrollFrame). Props only.
import { ScrollFrame } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitRun } from '../types.ts'
import { ToolkitRunDetail } from './ToolkitRunDetail.tsx'
import { ToolkitRunHeader } from './ToolkitRunHeader.tsx'

// D12 445:465: the content 21 in from the sides and 19 from the top (20 on the grid), as the discussion panel's.
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minH: '[0]',
  overflow: 'hidden',
  p: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})

export type ToolkitRunPanelProps = {
  run: ToolkitRun
  status: string
  openSession: string
  onClose?: (() => void) | undefined
}

export function ToolkitRunPanel({ run, status, openSession, onClose }: ToolkitRunPanelProps) {
  return (
    <aside aria-label={run.name} className={panel} data-figma="side panel · run">
      <ScrollFrame gap="12" header={<ToolkitRunHeader run={run} status={status} onClose={onClose} />}>
        <ToolkitRunDetail run={run} openSession={openSession} />
      </ScrollFrame>
    </aside>
  )
}
