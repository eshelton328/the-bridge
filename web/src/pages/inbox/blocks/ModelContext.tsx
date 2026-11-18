// A discussion's model and how much of its context it uses: the model
// picker, the meter and its label, as a Workbench chat shows them. Props
// only.
import { ContextMeter, Inline, ModelChip } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDiscussion } from '../types.ts'

// Figma's "context" (D15, M18, T17) is Geist Regular 11, 38 px wide: `smallXs`, not the mono style.
const muted = css({ textStyle: 'smallXs', color: 'fg.muted' })
const hug = css({ alignSelf: 'flex-start' })

export function ModelContext({ discussion, centred = false }: { discussion: InboxDiscussion; centred?: boolean }) {
  return (
    <Inline gap="8" align="center" className={centred ? undefined : hug} data-figma="model and context">
      <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
      <ContextMeter value={discussion.context} />
      <span className={muted}>{discussion.contextLabel}</span>
    </Inline>
  )
}
