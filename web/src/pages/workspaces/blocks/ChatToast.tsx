// A toast that confirms what Erik just did to the chat shown alone, centred
// over its composer, with its button, such as "Moved bridge themes to
// the-bridge" and Undo (D20 417:2135). It is the library's static `Toast`,
// which the caller places: `MainChat` draws it between the transcript and
// the composer. Props only.
import { Toast } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// The footer is a flex column; the toast keeps its own width, centred.
const place = css({ alignSelf: 'center', maxW: '[100%]', minW: '[0]' })

export type ChatToastProps = {
  text: string
  action: string
  onAction?: (() => void) | undefined
  /** The Figma layer of the toast, for the fidelity checks. */
  figma?: string | undefined
}

export function ChatToast({ text, action, onAction, figma }: ChatToastProps) {
  return (
    <div data-figma={figma} className={place}>
      <Toast
        action={{
          label: action,
          onClick: () => {
            onAction?.()
          },
        }}
      >
        {text}
      </Toast>
    </div>
  )
}
