// The chat shown alone beside the sidebar while the page waits for its first list (R58, the loading standard): the
// desktop opens on its focused chat (D2b), so the page draws that chat's layout at once. The header's rows are
// skeletons, the transcript is the chat's own skeleton (TranscriptSkeleton, as a live chat shows until its transcript
// reads) and the composer is the chat's, off, so the loaded chat takes its place with no jump. Props only.
import { css } from '../../../../styled-system/css/index.js'
import { ChatHeadSkeleton } from './ChatHeadSkeleton.tsx'
import { ChatPane } from './ChatPane.tsx'

// As MainChat: the detail slot is a flex column, and the chat fills it.
const column = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minW: '[0]',
  minH: '[0]',
})

export type ChatSkeletonProps = {
  /** What loads, such as "Loading this chat"; a screen reader says it once, as a status. */
  label: string
  /** The composer's text while it is off, such as "Loading…". */
  composer: string
}

export function ChatSkeleton({ label, composer }: ChatSkeletonProps) {
  return (
    <section aria-label={label} className={column}>
      <ChatHeadSkeleton />
      <ChatPane
        size="full"
        chatId="loading"
        figma={{ composer: '105:889', entries: [] }}
        entries={[]}
        loading={{ label }}
        composer={{ placeholder: composer, text: '', attachments: [], running: false, notLive: composer }}
      />
    </section>
  )
}
