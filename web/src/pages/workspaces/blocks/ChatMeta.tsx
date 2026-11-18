// A chat's meta line in the workspace sidebar and the phone's list (D2
// 105:643, M2 105:2547): its model, or for a shell its program, and the
// context it has used. Props only.
import { ContextMeter, Inline } from '@eshelton328/component-library-1701'
import type { SidebarChat } from '../types.ts'

export type ChatMetaProps = {
  chat: SidebarChat
  className?: string | undefined
}

export function ChatMeta({ chat, className }: ChatMetaProps) {
  return (
    <Inline gap="4" align="center" className={className}>
      <span>{chat.model}</span>
      {/* d-100: a context of 75 or more is drawn in amber, as on the empty pane of D1. */}
      {chat.context === undefined ? null : <ContextMeter value={chat.context} high={chat.context >= 75} />}
    </Inline>
  )
}
