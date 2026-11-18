// What the artifact's discussion may do, after a lock (Figma "guard", D7
// 452:2420, T4 452:3788): under the model in the desktop panel, and in the
// artifact's card on the tablet's discussion page. Props only.
import { LockIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const guard = css({ display: 'flex', gap: '6', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const lock = css({ display: 'inline-flex', flexShrink: '0', pt: '2' })

export type DiscussionGuardProps = {
  text: string
}

export function DiscussionGuard({ text }: DiscussionGuardProps) {
  return (
    <p className={guard} data-figma="guard">
      <span className={lock}>
        <LockIcon size="12" />
      </span>
      {text}
    </p>
  )
}
