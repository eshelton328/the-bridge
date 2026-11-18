// An open chat beside the Activity view on the desktop (Figma `side panel ·
// chat`, D18 475:373): `ToolkitChatHeader` with close at the top and
// `ToolkitChatDetail` under it, in the AppShell's wide side slot, as an open
// run's panel (D12). Figma lays a 440 px panel over the view; the slot is 420
// and the view beside it narrows (LIBRARY_GAPS.md, Run side panel). Only the
// chat scrolls under its header (d-107, ScrollFrame). Props only.
import { ScrollFrame } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitActivityChat } from '../types.ts'
import { ToolkitChatDetail } from './ToolkitChatDetail.tsx'
import { ToolkitChatHeader } from './ToolkitChatHeader.tsx'

// D18 475:373: the content 21 in from the sides and 19 from the top (20 on the grid), as the run's panel.
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minH: '[0]',
  overflow: 'hidden',
  p: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})

export type ToolkitChatPanelProps = {
  chat: ToolkitActivityChat
  openSession: string
  onClose?: (() => void) | undefined
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitChatPanel({ chat, openSession, onClose, onOpenItem }: ToolkitChatPanelProps) {
  return (
    <aside aria-label={chat.title} className={panel} data-figma="side panel · chat">
      <ScrollFrame gap="12" header={<ToolkitChatHeader chat={chat} layout="desktop" onClose={onClose} />}>
        <ToolkitChatDetail chat={chat} layout="desktop" openSession={openSession} onOpenItem={onOpenItem} />
      </ScrollFrame>
    </aside>
  )
}
