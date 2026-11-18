// The top of an open run (Figma `header`, D12 445:466): the kind's icon, the
// run's name in the title style, its status badge (`badge · Running · icon`
// 479:14) and, in the desktop panel, close at the row's end. It stays at the
// top while the run under it scrolls (d-107). Props only.
import { Badge, Button, CloseIcon, Inline, SparkIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitRun } from '../types.ts'
import { ToolkitKindIcon } from './ToolkitKindIcon.tsx'

const heading = css({ textStyle: 'title', color: 'fg.default', m: '0', truncate: true, minW: '[0]' })
const spacer = css({ flex: '1' })

export type ToolkitRunHeaderProps = {
  run: ToolkitRun
  status: string
  /** Closes the panel; none on the run's own page, whose back row goes back. */
  onClose?: (() => void) | undefined
}

export function ToolkitRunHeader({ run, status, onClose }: ToolkitRunHeaderProps) {
  return (
    <Inline gap="8" align="center" data-figma={run.detail?.layers?.header}>
      <ToolkitKindIcon kind={run.kind} size="20" />
      <h2 className={heading}>{run.name}</h2>
      <Badge tone="running" label={status} icon={<SparkIcon size="12" />} />
      <span className={spacer} />
      {onClose === undefined ? null : (
        <Button variant="text" size="xs" iconOnly aria-label={`Close ${run.name}`} onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      )}
    </Inline>
  )
}
