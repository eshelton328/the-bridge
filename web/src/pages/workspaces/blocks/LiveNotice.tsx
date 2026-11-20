// The notice that the live source (`?source=live`) could not be read and the
// page shows its sample data (audit W-2, P-2). Each layout draws it at the
// top of its own content: under the phone's and tablet's list header, over
// a chat's header on the phone and tablet, at the top of the desktop
// sidebar and over the workbench's panes. So the owner sees it in every
// layout, where the status bar alone showed it before, it covers no row or
// control, and the shell keeps the window's height. The library has no
// banner (LIBRARY_GAPS.md "Page notice"): the closest part is ErrorState's
// `inline` row, an alert. Dismiss hides it until the
// page loads again. Props only.
import { Button } from '@eshelton328/component-library-1701'
import { ErrorState } from '../../../errors/ErrorState.tsx'
import { css } from '../../../../styled-system/css/index.js'

// The notice keeps its height in a flex column and the width of a dialog at most; ErrorState draws its surface.
const card = css({ flexShrink: '0', w: '[100%]', maxW: 'shell.dialog' })

export type LiveNoticeProps = {
  title: string
  description: string
  onDismiss: () => void
}

export function LiveNotice({ title, description, onDismiss }: LiveNoticeProps) {
  return (
    <div className={card}>
      <ErrorState
        size="inline"
        tone="neutral"
        title={title}
        description={description}
        actions={
          <Button size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        }
      />
    </div>
  )
}
