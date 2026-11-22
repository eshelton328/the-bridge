// The status line of an artifact on its own page (Figma "status", T2
// 405:427): New and who found it when, over the title. The desktop puts the
// same line in the artifact bar (D2). Props only.
import { Badge, Inline, SparkIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const found = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })
// 405:427: the line takes its own width.
const line = css({ alignSelf: 'flex-start' })

export type ArtifactStatusProps = {
  /** The pill at the start, such as "New"; none without it. */
  badge?: string | undefined
  found: string
}

export function ArtifactStatus({ badge, found: text }: ArtifactStatusProps) {
  return (
    <Inline gap="8" align="center" className={line} data-figma="status">
      {badge === undefined ? null : (
        <span data-figma="pill · New">
          <Badge label={badge} icon={<SparkIcon size="12" />} tone="working" size="sm" />
        </span>
      )}
      <p className={found} role="status">
        {text}
      </p>
    </Inline>
  )
}
