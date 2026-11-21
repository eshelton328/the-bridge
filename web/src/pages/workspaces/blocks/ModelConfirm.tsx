// The question a model pick asks before the chat restarts (W10): "Restart the chat with Sonnet? It resumes the same
// conversation." with Restart and Cancel, on its own row under the model chip's row, as the chip's menu has closed.
// Only Restart posts; Cancel does nothing. Restart is off while the chat works or restarts, and the chip's line says
// why. No Figma frame draws it (references D02 and M03 `deviations.md`). Props only.
import { Button, Inline } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const text = css({ textStyle: 'smallXs', color: 'fg.default' })

export type ModelConfirmProps = {
  /** The model the chat would restart with, such as "Sonnet". */
  model: string
  /** The chat works or restarts: Restart is off. */
  off: boolean
  onRestart: () => void
  onCancel: () => void
}

export function ModelConfirm({ model, off, onRestart, onCancel }: ModelConfirmProps) {
  const question = `Restart the chat with ${model}? It resumes the same conversation.`
  return (
    <Inline gap="8" align="center" wrap role="group" aria-label={question}>
      <span className={text}>{question}</span>
      <Inline gap="8" align="center">
        <Button size="xs" variant="primary" disabled={off} onClick={onRestart}>
          Restart
        </Button>
        <Button size="xs" onClick={onCancel}>
          Cancel
        </Button>
      </Inline>
    </Inline>
  )
}
