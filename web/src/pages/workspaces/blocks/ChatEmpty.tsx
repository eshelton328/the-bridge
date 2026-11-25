// A chat with no entries yet (R68, the owner: "something a bit more polished for new chats", with "nice icons that
// are centered", as a discussion's empty state has, but less detailed). It fills the transcript above the composer and
// centres the chat's kind mark in a round tile, the chat's name and one quiet line, with no buttons. It sits in the
// transcript, so on the keyboard it centres in the smaller space and never moves or covers the composer. The parts are
// a column that wraps: a part that no longer fits wraps to a second column, out of the box and clipped, so a short
// space hides the line first, then the name, with no measure and no size of its own. Library parts and tokens only;
// the tile is the Inbox discussion's (LIBRARY_GAPS.md, Empty state with an icon tile). Props only.
//
// R73 (the owner: "It's not smooth moving the text and icon with the keyboard"): the keyboard shrinks the transcript
// by the footer's dock (`--scroll-frame-dock`, ScrollFrame) at an open's end and a close's start, and a group centred
// in it jumped half that far. So the group stays where it is: a first grid row takes the dock, as far as the room
// under the group goes (`minmax(0, dock)` grows only into the free space), and the group centres in the rest. With
// room, its centre is the keyboard-closed one; with less, it sits on the composer, and with too little, the parts hide
// as before. It reads only the frame's public variable: no listener and no measure.
import { KindMark } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { AgentKind } from '../types.ts'

const box = css({
  flex: '1',
  minH: '[0]',
  alignSelf: 'stretch',
  display: 'grid',
  gridTemplateRows: '[minmax(0, var(--scroll-frame-dock, 0px)) minmax(auto, 1fr)]',
  gridTemplateColumns: '[minmax(0, 1fr)]',
  containerType: 'size',
  overflow: 'hidden',
})
// The parts' column: as high as its parts, at most the box, so a short box wraps the last parts out of view.
const group = css({
  gridRow: '2',
  alignSelf: 'center',
  maxH: '[100cqh]',
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  alignContent: 'flex-start',
  alignItems: 'center',
  rowGap: '10',
})
// Each part is as wide as the box, so a part that wraps lands in a second column past its right edge.
const part = css({ w: '[100%]', display: 'flex', justifyContent: 'center', textAlign: 'center' })
const tile = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: 'control.xl',
  h: 'control.xl',
  borderRadius: 'full',
  bg: 'surface.raised',
})
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0', overflowWrap: 'anywhere' })
const line = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

export type ChatEmptyProps = {
  /** The chat's kind: its mark, as the chat's header draws it. */
  kind: AgentKind
  /** The chat's name. */
  title: string
  /** The one quiet line, such as "Send a message to start." */
  text: string
}

export function ChatEmpty({ kind, title: name, text }: ChatEmptyProps) {
  return (
    <div className={box} data-chat-empty="">
      <div className={group}>
        <div className={part}>
          <span className={tile} data-chat-empty-part="mark">
            <KindMark kind={kind} size="20" />
          </span>
        </div>
        <p className={`${part} ${title}`} data-chat-empty-part="title">
          {name}
        </p>
        <p className={`${part} ${line}`} data-chat-empty-part="line">
          {text}
        </p>
      </div>
    </div>
  )
}
