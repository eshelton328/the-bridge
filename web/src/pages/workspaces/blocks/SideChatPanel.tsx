// The side chat: its title with the command that opens it and Close, a
// note, the question and the answer, and its own composer. `placement="side"`
// sits beside the main chat (D2 105:920); `placement="pane"` sits inside its
// pane of the split, over the chat's right side, with "Open as its own
// pane" over the composer (D5 158:518). Props only.
import { BubbleIcon, Button, CloseIcon, Inline, SplitIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { SideChat, SidebarLayers } from '../types.ts'
import { ChatPane } from './ChatPane.tsx'

const panel = css({ display: 'flex', flexDirection: 'column', minH: '[0]' })
const placements = {
  side: css({
    flex: '1',
    pt: '16',
    bg: 'surface.pane',
    borderLeftWidth: 'default',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border.default',
  }),
  // D5 158:518: 330 × 393, 4 in from the pane's body on the right, top and bottom, padded 15, its parts 10 apart.
  // In a pane too short for its title, two lines of transcript and its composer, the panel scrolls (d-107).
  pane: css({
    overflowY: 'auto',
    position: 'absolute',
    zIndex: '1',
    top: '4',
    right: '4',
    bottom: '4',
    w: 'shell.popover',
    p: '16',
    gap: '10',
    bg: 'surface.overlay',
    borderWidth: 'default',
    borderStyle: 'solid',
    borderColor: 'border.active',
    borderRadius: 'lg',
    boxShadow: 'overlay',
  }),
}
const tops = {
  side: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '16' }),
  pane: css({ display: 'flex', flexDirection: 'column', gap: '10' }),
}
const bubbles = {
  side: css({ display: 'inline-flex', color: 'accent.discuss' }),
  pane: css({ display: 'inline-flex', color: 'fg.accent' }),
}
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' })
const commands = {
  side: css({ textStyle: 'mono', color: 'accent.discuss', flex: '1' }),
  pane: css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' }),
}
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })

export type SideChatPanelProps = {
  chat: SideChat
  /** Beside the main chat (D2) or inside its pane of the split (D5); `side` when not set. */
  placement?: 'side' | 'pane' | undefined
  onClose?: (() => void) | undefined
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
}

export function SideChatPanel({ chat, placement = 'side', onClose, layers }: SideChatPanelProps) {
  const openAsPane =
    chat.openAsPane === undefined ? undefined : (
      <Inline>
        <Button size="xs" textSize="xs" data-figma="open as pane">
          <SplitIcon size="12" />
          {chat.openAsPane}
        </Button>
      </Inline>
    )
  return (
    <aside
      data-figma={layers?.sideChat ?? '105:920'}
      aria-label={chat.title}
      className={cx(panel, placements[placement])}
    >
      <div className={tops[placement]}>
        <Inline gap="8" align="center">
          <span className={bubbles[placement]}>
            <BubbleIcon size="16" />
          </span>
          <h2 className={heading}>{chat.title}</h2>
          <span className={commands[placement]}>{chat.command}</span>
          <Button variant="text" size="xs" iconOnly aria-label={chat.closeLabel} onClick={onClose}>
            <CloseIcon size="16" />
          </Button>
        </Inline>
        <p className={note} data-figma={layers?.sideNote ?? '105:932'}>
          {chat.note}
        </p>
      </div>
      <ChatPane
        size={placement === 'pane' ? 'inset' : 'side'}
        figma={{
          composer: layers?.sideComposer ?? '105:948',
          entries: layers?.sideEntries ?? ['105:933', '105:935'],
        }}
        entries={chat.entries}
        composer={chat.composer}
        attach={placement === 'side'}
        above={openAsPane}
      />
    </aside>
  )
}
