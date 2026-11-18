// The side chat on the phone (M5 105:3106): a sheet over the main chat with
// its own title, note, transcript and composer; nothing in it enters the main
// chat, which goes on under the scrim. The sheet has no title row of its own:
// `SideChatPanel placement="sheet"` draws the title with its command and ×.
// The title and the composer stay put and only the transcript scrolls
// (d-107). The focus goes to the message box when it opens. Props only.
import { BottomSheet } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SideChat, SidebarLayers } from '../types.ts'
import { SideChatPanel } from './SideChatPanel.tsx'

// The sheet is a flex column; the panel fills it and shrinks with it.
const fill = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type PhoneSideChatProps = {
  chat: SideChat
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
}

export function PhoneSideChat({ chat, open, onOpenChange, layers }: PhoneSideChatProps) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      size="sm"
      label={chat.title}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => ref.current?.querySelector('textarea') ?? null}
    >
      <div ref={ref} className={fill}>
        <SideChatPanel
          chat={chat}
          placement="sheet"
          layers={layers}
          onClose={() => {
            onOpenChange?.(false)
          }}
        />
      </div>
    </BottomSheet>
  )
}
