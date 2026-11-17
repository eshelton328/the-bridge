// The drop zone over the chat shown alone while Erik drags a chat from the
// sidebar onto it (D6 158:1025): a dashed cyan box over the part of the chat
// where the chat would open (an edge: beside, above or below; the middle:
// in its place), with the split icon, what the drop does, a line and the
// hint on where to drop, and the dragged chat under them where the pointer
// holds it (158:1034). The library has no drop zone (LIBRARY_GAPS.md): the
// box is a dashed `border.active` outline on the faint accent tint. The
// dragged chat is its sidebar row in the library's `DragPreview`. Props only.
import { DragPreview, SplitIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { DropEdge, SidebarChat } from '../types.ts'
import { SidebarChatRow } from './SidebarChatRow.tsx'

// The zone sits 12 in from the chat's edges (158:1025 is 12 from its top, right and bottom). It shows a drag and
// takes no pointer, so the transcript under it stays readable and the drop reaches the chat. Figma's dashes are
// about 2 px wide, brighter and longer than a 1 px line of border.active, so they are drawn at borderWidths.ring
// (2, d-100).
const zone = css({
  position: 'absolute',
  zIndex: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pointerEvents: 'none',
  borderRadius: 'lg',
  borderWidth: 'ring',
  borderStyle: 'dashed',
  borderColor: 'border.active',
  bg: 'accent.faint',
})
// Figma's right zone starts 4 past the chat's middle (957 in a chat from 394 to 1512).
const edges: Record<DropEdge, string> = {
  right: css({ top: '12', right: '12', bottom: '12', left: '[50%]', ms: '4' }),
  left: css({ top: '12', left: '12', bottom: '12', right: '[50%]', me: '4' }),
  top: css({ top: '12', left: '12', right: '12', bottom: '[50%]', mb: '4' }),
  bottom: css({ bottom: '12', left: '12', right: '12', top: '[50%]', mt: '4' }),
  middle: css({ top: '12', left: '12', right: '12', bottom: '12' }),
}
// The two halves around the text take the same room, so the text sits in the zone's middle (158:1026 to 158:1048).
const half = css({ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', minH: '[0]' })
const middle = css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8' })
const icon = css({ display: 'inline-flex', color: 'fg.accent' })
const title = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' })
const text = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
// 158:1048: the hint in mono on a recessed box, padded 10 at the sides.
const hints = css({
  textStyle: 'monoSm',
  color: 'fg.muted',
  m: '0',
  px: '10',
  py: '6',
  bg: 'surface.well',
  borderRadius: 'md',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})
// The dragged chat (158:1034, 310 wide), where the pointer holds it: Figma puts it 111 under the hint; 40 is the
// largest spacing token (d-100), and 320 the nearest width token.
const preview = css({ mt: '40', w: 'shell.popover' })

export type PaneDropZoneProps = {
  /** Where the chat would land. */
  edge: DropEdge
  /** The dragged chat. */
  chat: SidebarChat
  title: string
  text: string
  hint: string
}

export function PaneDropZone({ edge, chat, title: heading, text: line, hint }: PaneDropZoneProps) {
  return (
    <div data-figma="158:1025" role="status" className={cx(zone, edges[edge])}>
      <div className={half} />
      <div className={middle}>
        <span className={icon} aria-hidden="true">
          <SplitIcon size="24" />
        </span>
        <p className={title}>{heading}</p>
        <p className={text}>{line}</p>
        <p className={hints} data-figma="158:1048">
          {hint}
        </p>
      </div>
      <div className={half}>
        <div className={preview}>
          <DragPreview>
            <SidebarChatRow chat={chat} figma="158:1034" />
          </DragPreview>
        </div>
      </div>
    </div>
  )
}
