// Quick chat's composer (R8): the library `Dialog` on every size, as no frame draws it. On a false `onSend` the
// composer keeps the text and shows the page's line. Props only.
import { Button, Composer, Dialog } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ProjectPageWords, QuickChatStatus } from '../types.ts'

const lineRow = css({ display: 'flex', alignItems: 'center', gap: '8', textStyle: 'small', color: 'fg.muted' })

export type QuickChatProps = {
  words: ProjectPageWords
  status: QuickChatStatus
  onSend: (text: string) => Promise<boolean>
  onRetry?: (() => void) | undefined
  onClose: () => void
}

export function QuickChat({ words, status, onSend, onRetry, onClose }: QuickChatProps) {
  return (
    <Dialog
      size="lg"
      title={words.quickChat}
      closeButton
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Composer label={words.message} placeholder={words.message} onSend={onSend} sendDisabled={status.busy} />
      {status.line === undefined ? null : (
        <div className={lineRow}>
          <p role="status">{status.line}</p>
          {status.retry === true ? (
            <Button size="sm" onClick={onRetry} disabled={status.busy}>
              {words.retry}
            </Button>
          ) : null}
        </div>
      )}
    </Dialog>
  )
}
