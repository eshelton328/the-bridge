// The drop zone while Erik drags a chat from the sidebar: over the chat shown
// alone (D6 158:1025) or over a pane of the workbench (D8 402:1112). A dashed
// cyan box over the part of the chat or pane where the chat would open (an
// edge: beside, above or below; the middle: in its place), with the split
// icon unless the drop turns it off, what the drop does, a line and, when
// set, the hint on where to drop, and the dragged chat under them where the
// pointer holds it (158:1034, 402:1126). The library has no drop zone
// (LIBRARY_GAPS.md): the box is a dashed `border.active` outline on the faint
// accent tint. The dragged chat is its sidebar row in the library's
// `DragPreview`. Props only.
import { DragPreview, SplitIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { DropEdge, PaneDrop, SidebarChat } from '../types.ts'
import { SidebarChatRow } from './SidebarChatRow.tsx'

// The zone shows a drag and takes no pointer, so the transcript under it stays readable and the drop reaches the
// chat. Figma's dashes are about 2 px wide, brighter and longer than a 1 px line of border.active, so they are drawn
// at borderWidths.ring (2, d-100).
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
// Over the chat alone the zone sits 12 in from the chat's edges (158:1025 is 12 from its top, right and bottom); over
// a pane, 4 in from the pane's (402:1112). Both start 4 past the middle (D6 957 in a chat from 394 to 1512, D8 957
// in a pane from 404 to 1502).
const edges: Record<'chat' | 'pane', Record<DropEdge, string>> = {
  chat: {
    right: css({ top: '12', right: '12', bottom: '12', left: '[50%]', ms: '4' }),
    left: css({ top: '12', left: '12', bottom: '12', right: '[50%]', me: '4' }),
    top: css({ top: '12', left: '12', right: '12', bottom: '[50%]', mb: '4' }),
    bottom: css({ bottom: '12', left: '12', right: '12', top: '[50%]', mt: '4' }),
    middle: css({ top: '12', left: '12', right: '12', bottom: '12' }),
  },
  pane: {
    right: css({ top: '4', right: '4', bottom: '4', left: '[50%]', ms: '4' }),
    left: css({ top: '4', left: '4', bottom: '4', right: '[50%]', me: '4' }),
    top: css({ top: '4', left: '4', right: '4', bottom: '[50%]', mb: '4' }),
    bottom: css({ bottom: '4', left: '4', right: '4', top: '[50%]', mt: '4' }),
    middle: css({ top: '4', left: '4', right: '4', bottom: '4' }),
  },
}
// The two halves around the text take the same room, so the text sits in the zone's middle (158:1026 to 158:1048,
// 402:1113 and 402:1114). Each is as wide as the zone, so the dragged chat can sit at its end.
const half = css({
  flex: '1',
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minH: '[0]',
})
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
// The dragged chat, where the pointer holds it. Over the chat alone Figma puts it 111 under the hint (158:1034); 40
// is the largest spacing token (d-100), and it is centred and 320 wide (shell.popover, nearest to 310). Over a pane
// (402:1126) it is a third of the way down the room under the text (115 of about 350 left over), so that room is
// split 1 : 2 around it with no length, and it sits 20 in from the zone's end (Figma 26) and is 300 wide
// (shell.popoverFilter, nearest to its 289 before its 3° turn) (d-100).
const preview = {
  chat: css({ mt: '40', w: 'shell.popover' }),
  pane: css({ w: 'shell.popoverFilter', alignSelf: 'flex-end', me: '20' }),
}
const above = css({ flex: '1' })
const below = css({ flex: '[2]' })

export type PaneDropZoneProps = {
  /** Where the chat would land. */
  edge: DropEdge
  /** The dragged chat. */
  chat: SidebarChat
  /** The title of the chat or pane it is dragged over. */
  target: string
  /** The zone's text; {chat} and {target} are filled in. */
  drop: PaneDrop
  /** Over the chat shown alone (D6) or a pane of the workbench (D8). */
  placement?: 'chat' | 'pane' | undefined
  /** The Figma layers of the zone, the dragged chat and the hint; D6's when not set. */
  figma?: { zone: string; preview: string; hint?: string | undefined } | undefined
}

export function PaneDropZone({ edge, chat, target, drop, placement = 'chat', figma }: PaneDropZoneProps) {
  const fill = (s: string) => s.replace('{chat}', chat.title).replace('{target}', target)
  const layers = figma ?? { zone: '158:1025', preview: '158:1034', hint: '158:1048' }
  return (
    <div data-figma={layers.zone} role="status" className={cx(zone, edges[placement][edge])}>
      <div className={half} />
      <div className={middle}>
        {drop.icon === false ? null : (
          <span className={icon} aria-hidden="true">
            <SplitIcon size="24" />
          </span>
        )}
        <p className={title}>{fill(drop.title)}</p>
        <p className={text}>{fill(drop.text)}</p>
        {drop.hint === undefined ? null : (
          <p className={hints} data-figma={layers.hint}>
            {drop.hint}
          </p>
        )}
      </div>
      <div className={half}>
        {placement === 'pane' ? <div className={above} /> : null}
        <div className={preview[placement]}>
          <DragPreview>
            <SidebarChatRow chat={chat} figma={layers.preview} />
          </DragPreview>
        </div>
        {placement === 'pane' ? <div className={below} /> : null}
      </div>
    </div>
  )
}
