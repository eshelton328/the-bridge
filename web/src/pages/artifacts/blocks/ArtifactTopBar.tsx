// The Back bar over an artifact on its own page (Figma "top bar", T2
// 405:414): Back to the library and, at the end, Discuss, and Copy link and
// Remove as icons. It stays at the top while the page under it scrolls
// (d-107). Props only; the page entry closes the artifact.
import { BackRow, BubbleIcon, Button, CopyIcon, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// T2: the bar is 20 under the status bar (the Container's 12 and 8) and the title block 18 under it (20 on the 4 px
// grid, d-100: a tie takes the larger token, d-072).
const bar = css({ pt: '8', pb: '20' })

export type ArtifactTopBarProps = {
  /** The name of the list Back returns to, such as "Artifacts". */
  backLabel: string
  onBack?: (() => void) | undefined
  /** Discuss was pressed; without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  onCopyLink?: (() => void) | undefined
  onRemove?: (() => void) | undefined
}

export function ArtifactTopBar({ backLabel, onBack, onDiscuss, onCopyLink, onRemove }: ArtifactTopBarProps) {
  return (
    <div className={bar}>
      <div data-figma="top bar">
        <BackRow label={backLabel} onBack={onBack}>
          {/* 452:4185 is 87 × 30 with 11 px sides: the 28 px `sm` button (8 px sides) is the nearest in width. */}
          <span data-figma="button · Discuss">
            <Button size="sm" textSize="sm" onClick={onDiscuss}>
              <BubbleIcon />
              Discuss
            </Button>
          </span>
          <span data-figma="button · copy">
            <Button size="lg" iconOnly aria-label="Copy link" onClick={onCopyLink}>
              <CopyIcon />
            </Button>
          </span>
          <span data-figma="button · trash">
            <Button size="lg" iconOnly variant="secondaryDanger" aria-label="Remove" onClick={onRemove}>
              <TrashIcon />
            </Button>
          </span>
        </BackRow>
      </div>
    </div>
  )
}
