// The action card of an idea's page (d-135, D09): Chat about this idea
// across the card (NCC-132 AC2: off while busy, with a status line for a
// start or send that missed), then Make a feature and Park, which the
// frames draw and which do nothing until increment four (d-133). Props only.
import { Button, ChatIcon, ClockIcon, FeatureIcon, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ProjectPageWords, QuickChatStatus } from '../types.ts'

// A column stretches its button across the card.
const chatRow = css({ display: 'flex', flexDirection: 'column' })
const later = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12', pt: '10' })
// An empty status line keeps its place for a screen reader and takes no height.
const line = css({ textStyle: 'small', color: 'fg.muted', pt: '8', _empty: { pt: '0' } })

export type IdeaActionsProps = {
  words: Pick<ProjectPageWords, 'ideaChat' | 'ideaPage'>
  /** The chat start's status: busy, or the line of a miss. */
  chat?: QuickChatStatus | undefined
  onChat?: (() => void) | undefined
}

export function IdeaActions({ words, chat, onChat }: IdeaActionsProps) {
  return (
    <Panel>
      <div className={chatRow}>
        <Button variant="primary" size="md" disabled={chat?.busy === true} onClick={onChat}>
          <ChatIcon />
          {words.ideaChat}
        </Button>
      </div>
      <div className={later}>
        <Button variant="secondary" size="md">
          <FeatureIcon />
          {words.ideaPage.makeFeature}
        </Button>
        <Button variant="text" size="md">
          <ClockIcon />
          {words.ideaPage.park}
        </Button>
      </div>
      <p role="status" className={line}>
        {chat?.line ?? ''}
      </p>
    </Panel>
  )
}
