// The bar over an open artifact (Figma "artifact bar", D2 403:449): New and
// who found it when, and at the end Discuss, Copy link and Remove. Discuss
// opens the discussion (D7) and is pressed while it is open. Props only.
import { Badge, BubbleIcon, Button, CopyIcon, Inline, SparkIcon, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const found = css({ textStyle: 'mono', color: 'fg.muted', flex: '1', overflow: 'hidden' })

export type ArtifactBarProps = {
  isNew: boolean
  found: string
  /** The discussion is open beside the artifact (D7): Discuss is pressed. */
  discussOpen?: boolean | undefined
  onDiscuss?: (() => void) | undefined
  onCopyLink?: (() => void) | undefined
  onRemove?: (() => void) | undefined
}

export function ArtifactBar({ isNew, found: text, discussOpen, onDiscuss, onCopyLink, onRemove }: ArtifactBarProps) {
  return (
    <Inline gap="10" align="center" data-figma="artifact bar">
      {isNew ? (
        <span data-figma="pill · New">
          <Badge label="New" icon={<SparkIcon size="12" />} tone="working" size="sm" />
        </span>
      ) : null}
      <span className={found}>{text}</span>
      <span data-figma="button · Discuss">
        {/* Figma draws Discuss violet while the discussion is open; the library's pressed button is cyan. */}
        <Button textSize="sm" pressed={discussOpen} onClick={onDiscuss}>
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
