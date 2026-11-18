// The discussion's model and how much of its context window it uses (Figma
// "model and context", T5 464:311, M7 464:160): the model picker, the context
// meter and "context". The tablet's page puts it in the middle of its nav
// (T5); the phone's in the item's card under its meta line (M7). The same
// library parts as the Artifacts discussion's ModelContext. Props only.
import { ContextMeter, Inline, ModelChip } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitDiscussion } from '../types.ts'

// T5 464:329: "context" is 11 px text, 38 wide and 14 high: the sans `smallXs` (Regular 11/16 on the 4 px grid, d-072).
const meterLabel = css({ textStyle: 'smallXs', color: 'fg.muted' })
const hug = css({ alignSelf: 'flex-start' })

export type ToolkitDiscussModelProps = {
  discussion: Pick<ToolkitDiscussion, 'model' | 'context' | 'contextLabel'>
}

export function ToolkitDiscussModel({ discussion }: ToolkitDiscussModelProps) {
  return (
    <Inline gap="8" align="center" className={hug} data-figma="model and context">
      <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
      {discussion.context === undefined ? null : <ContextMeter value={discussion.context} />}
      <span className={meterLabel}>{discussion.contextLabel}</span>
    </Inline>
  )
}
