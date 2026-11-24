// The side chat on the phone (M5 105:3106): a sheet over the main chat with
// its own title, note, transcript and composer; nothing in it enters the main
// chat, which goes on under the scrim. The sheet has no title row of its own:
// `SideChatPanel placement="sheet"` draws the title with its command and ×.
// The title and the composer stay put and only the transcript scrolls
// (d-107). The focus goes to the message box when it opens. At a tablet's
// width (T2 105:1914, `device="tablet"`) the panel's parts sit further in,
// its note is larger and the sheet draws no scrim: Figma dims M5's chat
// (its `scrim` layer, 105:3105) but leaves T2's chat above the sheet in full
// colour. Screen review R71: the sheet docks on the keyboard while its message
// box has the focus (`keyboardDock`, library #347), so it rises with the
// keyboard and sets no body scroll lock, and the main chat's composer stays
// where it is. Only an explicit close closes it: ×, a swipe from the grabber
// or Escape, and on the phone a tap on the scrim too (`closeOn`). A press on
// the chat above the tablet's sheet, the focus and the keyboard keep it open,
// and the press does not reach the chat. A live side chat's unsent question
// stays in the page's drafts, so a close loses none of it. Props only.
import { BottomSheet } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SideChat, SidebarLayers } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
import type { DraftBook } from './draftBook.ts'
import { SideChatPanel } from './SideChatPanel.tsx'
import type { ComposerAnswer } from './useComposerActions.ts'

// The sheet is a flex column; the panel fills it and shrinks with it.
const fill = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type PhoneSideChatProps = {
  chat: SideChat
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The device whose width the sheet has: the phone (the default) or a tablet (T2). */
  device?: 'phone' | 'tablet' | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /** Asks a live side question (SideChatPanel `onSend`); not set, as in a sample, the message counts as sent at once. */
  onSend?: ((text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops the live side answer: the answering composer's Stop (SideChatPanel `onStop`). */
  onStop?: (() => Promise<ComposerAnswer>) | undefined
  /** The page's drafts by chat (SideChatPanel `drafts`). */
  drafts?: DraftBook | undefined
}

export function PhoneSideChat({
  chat,
  open,
  onOpenChange,
  device,
  layers,
  onCopy,
  onSend,
  onStop,
  drafts,
}: PhoneSideChatProps) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      size="sm"
      label={chat.title}
      scrim={device !== 'tablet'}
      keyboardDock
      closeOn={device === 'tablet' ? 'explicit' : 'scrim'}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => ref.current?.querySelector('textarea') ?? null}
    >
      <div ref={ref} className={fill}>
        <SideChatPanel
          chat={chat}
          placement="sheet"
          device={device}
          layers={layers}
          onCopy={onCopy}
          onSend={onSend}
          onStop={onStop}
          drafts={drafts}
          onClose={() => {
            onOpenChange?.(false)
          }}
        />
      </div>
    </BottomSheet>
  )
}
