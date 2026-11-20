// The side chat: its title with the command that opens it and Close, a
// note, the question and the answer, and its own composer. `placement="side"`
// sits beside the main chat (D2 105:920); `placement="pane"` sits inside its
// pane of the split, over the chat's right side, with "Open as its own
// pane" over a one-row composer (D5 158:518); `placement="sheet"` fills the
// phone's side chat sheet under its grabber (M5 105:3106), with a larger title. In
// the tablet's sheet (T2 105:1914, `device="tablet"`) its parts sit 23 in from the
// sheet's edges and the note is 13 px. Props only.
import { BubbleIcon, Button, CloseIcon, type IconSize, Inline, SplitIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { SideChat, SidebarLayers } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
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
  // The panel does not scroll: its title row and composer stay in view, and only its note and transcript scroll (d-107).
  // In a pane too short for the title row, a line of transcript and the composer, the panel scrolls, so the composer,
  // which keeps its height, can still be reached (ChatPane `inset`).
  pane: css({
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
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  }),
  // M5 105:3106: the sheet pads 12 and its parts sit 17 in from its edges, 12 under the grabber (with the sheet's gap
  // of 2). The panel shrinks with the sheet, so only the transcript scrolls (d-107).
  sheet: css({ flex: '1', px: '4', pt: '10' }),
}
// T2 105:1914: the tablet's sheet puts its parts 23 in from its edges (its 1 px border, 12 of padding and 10).
const tabletSheet = css({ flex: '1', px: '10', pt: '10' })
const tops = {
  side: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '16' }),
  pane: css({ display: 'flex', flexDirection: 'column', gap: '10' }),
  sheet: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
}
const bubbles = {
  side: css({ display: 'inline-flex', color: 'accent.discuss' }),
  pane: css({ display: 'inline-flex', color: 'fg.accent' }),
  sheet: css({ display: 'inline-flex', color: 'accent.discuss' }),
}
const headings = {
  side: css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' }),
  pane: css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' }),
  // M5 105:3112: the sheet's title is 17 px, as a sheet's title is.
  sheet: css({ textStyle: 'subtitle', color: 'fg.default', m: '0' }),
}
const commands = {
  side: css({ textStyle: 'mono', color: 'accent.discuss', flex: '1' }),
  pane: css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' }),
  sheet: css({ textStyle: 'mono', color: 'accent.discuss', flex: '1' }),
}
// The phone's sheet draws the bubble and × at 20, the others at 16.
// M5 105:3117: the sheet's × is grey, where a text button draws its icon in the accent colour.
const closeTones = { side: undefined, pane: undefined, sheet: css({ color: 'fg.muted' }) }
const iconSizes: Record<'side' | 'pane' | 'sheet', IconSize> = { side: '16', pane: '16', sheet: '20' }
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
// T2 105:1928: the tablet's note is Geist 13 on a 19 px line, `bodySm` (13/20) on the grid.
const tabletNote = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

export type SideChatPanelProps = {
  chat: SideChat
  /** Beside the main chat (D2), inside its pane of the split (D5) or in the phone's sheet (M5); `side` when not set. */
  placement?: 'side' | 'pane' | 'sheet' | undefined
  onClose?: (() => void) | undefined
  /** In a sheet, the device whose width it has: the phone (the default) or a tablet (T2). */
  device?: 'phone' | 'tablet' | undefined
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
}

export function SideChatPanel({
  chat,
  placement = 'side',
  onClose,
  device = 'phone',
  layers,
  onCopy,
}: SideChatPanelProps) {
  const tablet = placement === 'sheet' && device === 'tablet'
  const openAsPane =
    chat.openAsPane === undefined ? undefined : (
      <Inline>
        <Button size="xs" textSize="xs" data-figma="open as pane">
          <SplitIcon size="12" />
          {chat.openAsPane}
        </Button>
      </Inline>
    )
  // Beside the chat (D2) and in the phone's sheet (M5) the note stays under the title; in a pane (D5) it scrolls with
  // the transcript, so a short pane keeps the title, a line of transcript and the one-row composer in view (d-107).
  const noteText = (
    <p className={tablet ? tabletNote : note} data-figma={layers?.sideNote ?? '105:932'}>
      {chat.note}
    </p>
  )
  return (
    <aside
      data-figma={layers?.sideChat ?? (placement === 'sheet' ? undefined : '105:920')}
      aria-label={chat.title}
      className={cx(panel, tablet ? tabletSheet : placements[placement])}
    >
      <div className={tops[placement]}>
        <Inline gap="8" align="center" data-figma={layers?.sideHeader}>
          <span className={bubbles[placement]}>
            <BubbleIcon size={iconSizes[placement]} />
          </span>
          <h2 className={headings[placement]}>{chat.title}</h2>
          <span className={commands[placement]}>{chat.command}</span>
          <Button
            variant="text"
            size="xs"
            iconOnly
            className={closeTones[placement]}
            aria-label={chat.closeLabel}
            onClick={onClose}
          >
            <CloseIcon size={iconSizes[placement]} />
          </Button>
        </Inline>
        {placement !== 'pane' && noteText}
      </div>
      <ChatPane
        size={placement === 'pane' ? 'inset' : placement}
        // The side chat's data has no id of its own; its command and title name it.
        chatId={`${chat.command} ${chat.title}`}
        onCopy={onCopy}
        figma={{
          composer: layers?.sideComposer ?? '105:948',
          entries: layers?.sideEntries ?? ['105:933', '105:935'],
        }}
        entries={chat.entries}
        composer={chat.composer}
        attach={placement !== 'pane'}
        // D5 158:549: the one-row composer's Send draws a 12 px arrow; the other side chats' arrows are 14 (16 here).
        sendIconSize={placement === 'pane' ? '12' : undefined}
        layout={placement === 'pane' ? 'inline' : undefined}
        lead={placement === 'pane' ? noteText : undefined}
        above={openAsPane}
      />
    </aside>
  )
}
