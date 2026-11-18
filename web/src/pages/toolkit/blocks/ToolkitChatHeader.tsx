// The top of an open chat (Figma `header`, D18 475:374; T14 475:780; M16
// 475:1128): the chat icon, the chat's title in the title style and its
// status badge (`badge · Chat ended · icon` 479:2, the library's `Badge` in
// the done tone with the check icon). In the desktop panel the title ends
// with an ellipsis before the badge and close; on a tablet the badge ends the
// row; on the phone the icon, the title and the badge stand one under the
// other. It stays at the top while the chat under it scrolls (d-107). Props
// only.
import { Badge, Button, ChatIcon, CheckIcon, CloseIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityChat } from '../types.ts'

// D18 475:374: the icon, the title 8 after it, the badge 8 after the title; T14 475:780 the badge at the row's end.
const row = css({ display: 'flex', alignItems: 'center', gap: '8', minW: '[0]' })
// M16 475:1128: the icon, the title 6 under it and the badge 6 under the title.
const column = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6' })
const icon = css({ display: 'inline-flex', flexShrink: '0', color: 'fg.muted' })
const heading = css({ textStyle: 'title', color: 'fg.default', m: '0', truncate: true, minW: '[0]' })
const spacer = css({ flex: '1' })

export type ToolkitChatHeaderProps = {
  chat: ToolkitActivityChat
  layout: Viewport
  /** Closes the panel; none on the chat's own page, whose back row goes back. */
  onClose?: (() => void) | undefined
}

export function ToolkitChatHeader({ chat, layout, onClose }: ToolkitChatHeaderProps) {
  const status = chat.detail?.status
  const badge = status === undefined ? null : <Badge tone="done" label={status} icon={<CheckIcon size="12" />} />
  const title = <h2 className={heading}>{chat.title}</h2>
  const chatIcon = (
    <span className={icon}>
      <ChatIcon size="16" />
    </span>
  )
  const layer = chat.detail?.layers?.header ?? 'header'
  if (layout === 'phone') {
    return (
      <div className={column} data-figma={layer}>
        {chatIcon}
        {title}
        {badge}
      </div>
    )
  }
  return (
    <div className={row} data-figma={layer}>
      {chatIcon}
      {title}
      {layout === 'desktop' ? badge : null}
      <span className={spacer} />
      {layout === 'desktop' ? null : badge}
      {onClose === undefined ? null : (
        <Button variant="text" size="xs" iconOnly aria-label={`Close ${chat.title}`} onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      )}
    </div>
  )
}
