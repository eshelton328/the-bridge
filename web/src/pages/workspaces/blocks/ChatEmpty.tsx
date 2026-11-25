// A chat with no entries yet (R68, the owner: "something a bit more polished for new chats", with "nice icons that
// are centered", as a discussion's empty state has, but less detailed). It fills the transcript above the composer and
// centres the chat's kind mark in a round tile, the chat's name and one quiet line, with no buttons. It sits in the
// transcript, so on the keyboard it centres in the smaller space and never moves or covers the composer. The parts are
// a column that wraps: a part that no longer fits wraps to a second column, out of the box and clipped, so a short
// space hides the line first, then the name, with no measure and no size of its own. Library parts and tokens only;
// the tile is the Inbox discussion's (LIBRARY_GAPS.md, Empty state with an icon tile). Props only.
import { KindMark } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { AgentKind } from '../types.ts'

const box = css({
  flex: '1',
  minH: '[0]',
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignContent: 'flex-start',
  alignItems: 'center',
  rowGap: '10',
  overflow: 'hidden',
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
  )
}
