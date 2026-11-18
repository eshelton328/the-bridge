// The discussion's model and how much of its context window it uses (Figma
// "model and context", D7 454:311, T4 454:368): the model picker, the
// context meter and "context". The desktop panel puts it under the title
// (D7); the tablet's discussion page in the middle of its nav (T4). Props only.
import { ContextMeter, Inline, ModelChip } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDiscussion } from '../types.ts'

const meterLabel = css({ textStyle: 'monoSm', color: 'fg.muted' })

export type ModelContextProps = {
  discussion: Pick<ArtifactDiscussion, 'model' | 'context' | 'contextLabel'>
  className?: string | undefined
}

export function ModelContext({ discussion, className }: ModelContextProps) {
  return (
    <Inline gap="8" align="center" className={className} data-figma="model and context">
      <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
      <ContextMeter value={discussion.context} />
      <span className={meterLabel}>{discussion.contextLabel}</span>
    </Inline>
  )
}
