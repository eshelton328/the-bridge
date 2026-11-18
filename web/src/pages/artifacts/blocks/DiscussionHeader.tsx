// The top of the open artifact's discussion (D7 452:2410): the title with
// Open in workspace and Close, the model and how much context it uses, and
// what the discussion may do. It stays at the top of the panel while the
// discussion under it scrolls (d-107). Props only.
import { BubbleIcon, Button, ChatIcon, CloseIcon, Inline, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDiscussion } from '../types.ts'
import { DiscussionGuard } from './DiscussionGuard.tsx'
import { ModelContext } from './ModelContext.tsx'

const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1' })
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
const hug = css({ alignSelf: 'flex-start' })

export type DiscussionHeaderProps = {
  discussion: ArtifactDiscussion
  onOpenInWorkspace?: (() => void) | undefined
  onClose?: (() => void) | undefined
}

export function DiscussionHeader({ discussion, onOpenInWorkspace, onClose }: DiscussionHeaderProps) {
  return (
    <Stack gap="12">
      <Inline gap="8" align="center" data-figma="header">
        <span className={bubble}>
          <BubbleIcon size="16" />
        </span>
        <h2 className={heading}>{discussion.title}</h2>
        {/* Two layers are named "button · Open in workspace"; this is the header's. */}
        <span data-figma={discussion.layers.header}>
          <Button onClick={onOpenInWorkspace}>
            <ChatIcon />
            {discussion.openInWorkspace}
          </Button>
        </span>
        <span data-figma="button · x">
          <Button size="sm" iconOnly aria-label="Close the discussion" onClick={onClose}>
            <CloseIcon />
          </Button>
        </span>
      </Inline>
      <ModelContext discussion={discussion} className={hug} />
      <DiscussionGuard text={discussion.guard} />
    </Stack>
  )
}
