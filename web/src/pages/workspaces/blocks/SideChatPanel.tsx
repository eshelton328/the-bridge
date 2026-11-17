// The side chat beside the main chat (D2 105:920): its title with the
// command that opens it and Close, a note that nothing here enters the main
// chat, the question and the answer, and its own composer. Props only.
import { BubbleIcon, Button, CloseIcon, Inline } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SideChat, SidebarLayers } from '../types.ts'
import { ChatPane } from './ChatPane.tsx'

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minH: '[0]',
  pt: '16',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const top = css({ display: 'flex', flexDirection: 'column', gap: '12', px: '16' })
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' })
const command = css({ textStyle: 'mono', color: 'accent.discuss', flex: '1' })
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })

export type SideChatPanelProps = {
  chat: SideChat
  onClose?: (() => void) | undefined
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
}

export function SideChatPanel({ chat, onClose, layers }: SideChatPanelProps) {
  return (
    <aside data-figma={layers?.sideChat ?? '105:920'} aria-label={chat.title} className={panel}>
      <div className={top}>
        <Inline gap="8" align="center">
          <span className={bubble}>
            <BubbleIcon size="16" />
          </span>
          <h2 className={heading}>{chat.title}</h2>
          <span className={command}>{chat.command}</span>
          <Button variant="text" size="xs" iconOnly aria-label={chat.closeLabel} onClick={onClose}>
            <CloseIcon size="16" />
          </Button>
        </Inline>
        <p className={note} data-figma={layers?.sideNote ?? '105:932'}>
          {chat.note}
        </p>
      </div>
      <ChatPane
        size="side"
        figma={{
          composer: layers?.sideComposer ?? '105:948',
          entries: layers?.sideEntries ?? ['105:933', '105:935'],
        }}
        entries={chat.entries}
        composer={chat.composer}
      />
    </aside>
  )
}
