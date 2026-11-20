// The Back bar over an artifact on its own page (Figma "top bar", T2
// 405:414, M2 406:361): Back to the library and, at the end, on a tablet
// Discuss, and Copy link and Remove as icons; on a phone only the ⋯ button,
// which opens File in a project (M7). It stays at the top while the page
// under it scrolls (d-107). Props only; the page entry closes the artifact.
import { BackRow, BubbleIcon, Button, MoreIcon, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { CopyLinkStatus } from '../types.ts'
import { CopyLinkButton } from './CopyLinkButton.tsx'

// T2: the bar is 20 under the status bar (the Container's 12 and 8) and the title block 18 under it (20 on the 4 px
// grid, d-100: a tie takes the larger token, d-072).
const bar = css({ pt: '8', pb: '20' })
// M2: the bar is 4 under the status bar (the phone Container's top) and the title block 16 under its 36 px button
// (406:361 to 406:370).
const phoneBar = css({ pb: '16' })

export type ArtifactTopBarProps = {
  /** The name of the list Back returns to, such as "Artifacts". */
  backLabel: string
  /** `phone` (M2) has only the ⋯ button at the end; `tablet` (T2, the default) Discuss, Copy link and Remove. */
  layout?: 'tablet' | 'phone' | undefined
  onBack?: (() => void) | undefined
  /** Discuss was pressed; without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  onCopyLink?: (() => void) | undefined
  /** What the last Copy link did: the tablet's copy icon and its name show it. */
  copyLinkStatus?: CopyLinkStatus | undefined
  onRemove?: (() => void) | undefined
  /** The phone's ⋯ button was pressed: File in a project opens (M7). */
  onMore?: (() => void) | undefined
}

export function ArtifactTopBar({
  backLabel,
  layout = 'tablet',
  onBack,
  onDiscuss,
  onCopyLink,
  copyLinkStatus,
  onRemove,
  onMore,
}: ArtifactTopBarProps) {
  return (
    <div className={layout === 'phone' ? phoneBar : bar}>
      <div data-figma="top bar">
        <BackRow label={backLabel} onBack={onBack}>
          {layout === 'phone' ? (
            // 406:367: a 36 px button with a 16 px ⋯.
            <span data-figma="button · more">
              <Button size="lg" iconOnly aria-label="File in a project" onClick={onMore}>
                <MoreIcon />
              </Button>
            </span>
          ) : (
            <>
              {/* 452:4185 is 87 × 30 with 11 px sides: the 28 px `sm` button (8 px sides) is the nearest in width. */}
              <span data-figma="button · Discuss">
                <Button size="sm" textSize="sm" onClick={onDiscuss}>
                  <BubbleIcon />
                  Discuss
                </Button>
              </span>
              <span data-figma="button · copy">
                <CopyLinkButton size="lg" iconOnly status={copyLinkStatus} onClick={onCopyLink} />
              </span>
              <span data-figma="button · trash">
                <Button size="lg" iconOnly variant="secondaryDanger" aria-label="Remove" onClick={onRemove}>
                  <TrashIcon />
                </Button>
              </span>
            </>
          )}
        </BackRow>
      </div>
    </div>
  )
}
