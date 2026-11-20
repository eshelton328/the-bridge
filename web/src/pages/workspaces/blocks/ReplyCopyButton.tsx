// An agent's reply's Copy (D1 105:874) and what it did (audit P-4, W-6): a
// press calls `onCopy`, and the button reads "Copied" or "Copy failed" for
// `shownFor` ms, then its label again, as Artifacts' Copy link does. A polite
// live region beside it says the result to a screen reader; it has no
// `status` role, so a transcript of replies does not add one status region
// each beside the page's toast. Without
// `onCopy` (a story, the canvas) the button does nothing. Props only; the page
// entry writes the clipboard (lib/copyText.ts).
import { Button, CheckIcon, CopyIcon } from '@eshelton328/component-library-1701'
import { useEffect, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { CopyTextResult } from '../../../lib/copyText.ts'

/** How long the button says what the press did before it shows its label again. */
const shownFor = 2000

const labels = { copied: 'Copied', failed: 'Copy failed' } as const
const srOnly = css({ srOnly: true })

type Shown = { status: keyof typeof labels }

export type ReplyCopyButtonProps = {
  /** The button's label, such as "Copy". */
  label: string
  /** Copies the reply and says whether it did; the button shows the result. */
  onCopy?: (() => Promise<CopyTextResult>) | undefined
}

export function ReplyCopyButton({ label, onCopy }: ReplyCopyButtonProps) {
  // A new object on each press, so a second press starts the time again.
  const [shown, setShown] = useState<Shown | undefined>(undefined)
  useEffect(() => {
    if (shown === undefined) return
    const timer = setTimeout(() => {
      setShown(undefined)
    }, shownFor)
    return () => {
      clearTimeout(timer)
    }
  }, [shown])
  return (
    <>
      <Button
        size="xs"
        textSize="xs"
        keepIconSize
        onClick={
          onCopy === undefined
            ? undefined
            : () => {
                void onCopy().then((result) => {
                  setShown({ status: result.ok ? 'copied' : 'failed' })
                })
              }
        }
      >
        {shown?.status === 'failed' ? null : shown?.status === 'copied' ? (
          <CheckIcon size="12" />
        ) : (
          <CopyIcon size="12" />
        )}
        {shown === undefined ? label : labels[shown.status]}
      </Button>
      <span aria-live="polite" className={srOnly}>
        {shown === undefined ? '' : labels[shown.status]}
      </span>
    </>
  )
}
