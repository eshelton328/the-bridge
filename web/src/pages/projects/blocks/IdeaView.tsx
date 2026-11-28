// An idea's page on a project's page (R11, NCC-132's live slice): Back to
// Ideas, the title with its kind, state and tags, and the record's text as
// Markdown in a `MarkdownView` (links underlined, list markers), which holds
// its open questions and links. With `onChat`, "Chat about this idea" starts
// a chat about it (NCC-132 AC2): off while busy, and a status line says a
// start or send that missed. Plain on every size for now; the frames (D09,
// T09, M09) are a later issue's. Props only.
import { BackRow, Button, ChatIcon, MarkdownView } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { MarkdownText } from '../../../blocks/MarkdownText.tsx'
import type { IdeaPage, ProjectPageWords, QuickChatStatus } from '../types.ts'
import { ideaMeta } from './IdeasList.tsx'

const head = css({ display: 'flex', flexDirection: 'column', gap: '4', pt: '16', pb: '16' })
const title = css({ textStyle: 'heading', color: 'fg.default' })
const meta = css({ textStyle: 'small', color: 'fg.muted' })
const chatRow = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8', pb: '16' })

/** The record's text without its first `# ` heading (an empty one too), which the page draws as its title; never the next line. */
const bodyOf = (text: string) => text.replace(/^\s*#(?:[ \t][^\n]*)?(?:\n+|$)/, '')

export type IdeaViewProps = {
  idea: IdeaPage
  words: Pick<ProjectPageWords, 'ideaKinds' | 'ideaStates' | 'ideaBack' | 'ideaBackLabel' | 'ideaChat'>
  /** The chat start's status: busy, or the line of a miss. */
  chat?: QuickChatStatus | undefined
  onBack?: (() => void) | undefined
  onChat?: (() => void) | undefined
}

export function IdeaView({ idea, words, chat, onBack, onChat }: IdeaViewProps) {
  return (
    <article>
      <BackRow label={words.ideaBack} backLabel={words.ideaBackLabel} onBack={onBack} />
      <div className={head}>
        <h2 className={title}>{idea.row.title}</h2>
        <p className={meta}>{ideaMeta(idea.row, words)}</p>
      </div>
      {onChat === undefined ? null : (
        <div className={chatRow}>
          <Button variant="secondary" size="md" disabled={chat?.busy === true} onClick={onChat}>
            <ChatIcon />
            {words.ideaChat}
          </Button>
          <p role="status" className={meta}>
            {chat?.line ?? ''}
          </p>
        </div>
      )}
      <MarkdownView padding="none">
        <MarkdownText text={bodyOf(idea.body)} />
      </MarkdownView>
    </article>
  )
}
