// The top of an item's discussion in the desktop panel (D5 `header` 438:3):
// the chat icon, Discuss and the item's name, Open in Workbench and close;
// what the chat is for (438:15), and the item's folder, attached read-only
// (`context` 438:16). It stays at the top of the panel while the messages
// under it scroll (d-107). Props only.
import { Button, ChatIcon, ClipIcon, CloseIcon, Inline, LockIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitDiscussion } from '../types.ts'
import { ToolkitOpenInWorkbench } from './ToolkitOpenInWorkbench.tsx'

const icon = css({ display: 'inline-flex', color: 'accent.discuss' })
// 438:6: Discuss is SemiBold 24 (76 × 29): the `title` text style.
const heading = css({ textStyle: 'title', color: 'fg.default', m: '0' })
// 438:7: the item's name in violet mono 12 (44 × 17).
const name = css({ textStyle: 'mono', color: 'accent.discuss', flex: '1' })
// 438:15: Regular 12/17 in two lines.
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
// 438:16: 378 × 33, its text 11 in and 8 down, the paperclip and the lock in grey.
const context = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  px: '10',
  py: '8',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'md',
  bg: 'surface.inset',
  color: 'fg.muted',
})
// 438:19: the path is mono 12 (224 × 17).
const attached = css({ textStyle: 'mono', color: 'fg.default', flex: '1' })
const readOnly = css({ display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'monoSm', color: 'fg.muted' })

export type ToolkitDiscussHeaderProps = {
  discussion: ToolkitDiscussion
  /** The item under discussion, after the title. */
  itemName: string
  onClose?: (() => void) | undefined
}

export function ToolkitDiscussHeader({ discussion, itemName, onClose }: ToolkitDiscussHeaderProps) {
  return (
    <Stack gap="12">
      <Inline gap="8" align="center" data-figma="header">
        <span className={icon}>
          <ChatIcon size="16" />
        </span>
        <h2 className={heading}>{discussion.title}</h2>
        <span className={name}>{itemName}</span>
        <ToolkitOpenInWorkbench label={discussion.openInWorkbench} />
        <Button variant="text" size="xs" iconOnly aria-label="Close the discussion" onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      </Inline>
      {discussion.note === undefined ? null : (
        <p className={note} data-figma="438:15">
          {discussion.note}
        </p>
      )}
      {discussion.attached === undefined ? null : (
        <div className={context} data-figma="context">
          <ClipIcon size="12" />
          <span className={attached}>{discussion.attached.text}</span>
          <span className={readOnly}>
            <LockIcon size="12" />
            {discussion.attached.readOnly}
          </span>
        </div>
      )}
    </Stack>
  )
}
