// The bar over an open artifact (Figma "artifact bar", D2 403:449): New and
// who found it when (after Apply, D9: Updated and where from), and at the end Discuss, Copy link and Remove. Discuss
// opens the discussion (D7) and is pressed while it is open. Props only.
import { Badge, BubbleIcon, Button, CopyIcon, Inline, SparkIcon, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const found = css({ textStyle: 'mono', color: 'fg.muted', flex: '1', overflow: 'hidden' })

export type ArtifactBarProps = {
  /** The pill at the start, such as "New" or, after Apply, "Updated" (D9); none without it. */
  badge?: string | undefined
  found: string
  /** The discussion is open beside the artifact (D7): Discuss is pressed. */
  discussOpen?: boolean | undefined
  onDiscuss?: (() => void) | undefined
  onCopyLink?: (() => void) | undefined
  onRemove?: (() => void) | undefined
}

export function ArtifactBar({ badge, found: text, discussOpen, onDiscuss, onCopyLink, onRemove }: ArtifactBarProps) {
  return (
    <Inline gap="10" align="center" data-figma="artifact bar">
      {badge === undefined ? null : (
        <span data-figma="pill · New">
          <Badge label={badge} icon={<SparkIcon size="12" />} tone="working" size="sm" />
        </span>
      )}
      <span className={found}>{text}</span>
      <span data-figma="button · Discuss">
        {/* Open, its border is accent.discuss; Figma's violet fill has no token (LIBRARY_GAPS.md). */}
        <Button textSize="sm" pressed={discussOpen} pressedBorder="discuss" onClick={onDiscuss}>
          <BubbleIcon />
          Discuss
        </Button>
      </span>
      <span data-figma="button · Copy link">
        <Button onClick={onCopyLink}>
          <CopyIcon />
          Copy link
        </Button>
      </span>
      <span data-figma="button · Remove">
        <Button variant="secondaryDanger" onClick={onRemove}>
          <TrashIcon />
          Remove
        </Button>
      </span>
    </Inline>
  )
}
