// The discussion's reply box (D5 `composer` 438:50, T5 and M7
// `composer · discussion`): the library Composer with the attach button and,
// on the desktop, the model chip. A suggestion of the empty state puts its
// question here. Attach opens nothing: no file flow is designed (deviations).
// Props only.
import { Composer, ModelChip } from '@eshelton328/component-library-1701'
import type { ToolkitDiscussion } from '../types.ts'

export type ToolkitDiscussComposerProps = {
  discussion: Pick<ToolkitDiscussion, 'placeholder' | 'model'>
  /** The Figma layer: `composer` in the desktop panel (D5), `composer · discussion` on a page (T5, M7). */
  layer: string
  /** The model chip after the attach button, as the desktop panel draws it (D5 `model` 438:56). */
  model?: boolean | undefined
  /** What Erik has typed. */
  draft: string
  onDraftChange: (text: string) => void
  onSend: (text: string) => void
}

/** Attach waits for a file flow: a press does nothing yet. */
const attachWaits = () => undefined

export function ToolkitDiscussComposer({
  discussion,
  layer,
  model = false,
  draft,
  onDraftChange,
  onSend,
}: ToolkitDiscussComposerProps) {
  return (
    <div data-figma={layer}>
      <Composer
        label={discussion.placeholder}
        placeholder={discussion.placeholder}
        value={draft}
        onValueChange={onDraftChange}
        onSubmit={onSend}
        onAttach={attachWaits}
        model={
          model ? (
            <span data-figma="model">
              <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
