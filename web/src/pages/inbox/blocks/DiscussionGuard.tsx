// What a discussion may do, after a lock: it reads the task and its
// sources, runs nothing and changes the task only when the owner applies.
// Props only.
import { LockIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const guard = css({ display: 'flex', gap: '6', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const lock = css({ display: 'inline-flex', flexShrink: '0', pt: '2' })

export function DiscussionGuard({ text }: { text: string }) {
  return (
    <p className={guard} data-figma="guard">
      <span className={lock}>
        <LockIcon size="12" />
      </span>
      {text}
    </p>
  )
}
