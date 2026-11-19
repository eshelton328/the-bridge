// An open chat on a tablet or phone (Figma T14 475:779, M16 475:1127): a
// page of its own in the shared `DetailFrame` (d-107), under the back row
// Activity › Chats (`back row` 475:768: the Activity view's crumb goes back to
// it), with the chat under it: `ToolkitChatHeader` with no close, then
// `ToolkitChatDetail`. The back row is `ToolkitItemBack`'s trail (LIBRARY_GAPS.md,
// Item breadcrumb). Props only.
import { Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityChat } from '../types.ts'
import { ToolkitChatDetail } from './ToolkitChatDetail.tsx'
import { ToolkitChatHeader } from './ToolkitChatHeader.tsx'
import { ToolkitItemBack } from './ToolkitItemBack.tsx'

// T14 475:779: the chat 12 under the back row, its header 4 into it (16 under the row); the frame's gap is 8.
const article = css({ pt: '8' })

export type ToolkitChatPageProps = {
  chat: ToolkitActivityChat
  layout: Viewport
  /** What Back goes back to, such as "Activity". */
  backLabel: string
  /** The source the chat is listed in, such as "Chats": the trail's last crumb. */
  source: string
  openSession: string
  onBack?: (() => void) | undefined
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitChatPage({
  chat,
  layout,
  backLabel,
  source,
  openSession,
  onBack,
  onOpenItem,
}: ToolkitChatPageProps) {
  return (
    <DetailFrame
      layout={layout}
      back={<ToolkitItemBack name={source} named label={backLabel} onBack={onBack} actions={null} size="sm" />}
    >
      <article aria-label={chat.title} className={article} data-figma="side panel · chat">
        <Stack gap="12">
          <ToolkitChatHeader chat={chat} layout={layout} />
          <ToolkitChatDetail chat={chat} layout={layout} openSession={openSession} onOpenItem={onOpenItem} />
        </Stack>
      </article>
    </DetailFrame>
  )
}
