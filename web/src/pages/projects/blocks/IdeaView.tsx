// An idea's page on a project's page (R11, NCC-132's live slice; d-135,
// D09): Back to Ideas, the title with its kind, state and tags, and the
// record's text as Markdown in a `MarkdownView` (links underlined, list
// markers), less its first `# ` heading. The loader takes the Open
// questions list out of the text (../ideaBody.ts), so it shows only in its
// own panel. The action card (IdeaActions) comes first. Plain on every size for now; the
// frames' layout (D09, T09b, T09, M09) is the next PR's. Props only.
import { BackRow, MarkdownView } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { MarkdownText } from '../../../blocks/MarkdownText.tsx'
import type { IdeaPage, ProjectPageWords, QuickChatStatus } from '../types.ts'
import { IdeaActions } from './IdeaActions.tsx'
import { IdeaQuestions } from './IdeaQuestions.tsx'
import { ideaMeta } from './IdeasList.tsx'

const head = css({ display: 'flex', flexDirection: 'column', gap: '4', pt: '16', pb: '16' })
const title = css({ textStyle: 'heading', color: 'fg.default' })
const meta = css({ textStyle: 'small', color: 'fg.muted' })
const stack = css({ display: 'flex', flexDirection: 'column', gap: '16' })

/** The record's text without its first `# ` heading (an empty one too), which the page draws as its title; never the next line. */
const bodyOf = (text: string) => text.replace(/^\s*#(?:[ \t][^\n]*)?(?:\n+|$)/, '')

export type IdeaViewProps = {
  idea: IdeaPage
  words: Pick<ProjectPageWords, 'ideaKinds' | 'ideaStates' | 'ideaBack' | 'ideaBackLabel' | 'ideaChat' | 'ideaPage'>
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
      <div className={stack}>
        <IdeaActions words={words} chat={chat} onChat={onChat} />
        <MarkdownView padding="none">
          <MarkdownText text={bodyOf(idea.body)} />
        </MarkdownView>
        <IdeaQuestions title={words.ideaPage.questions} questions={idea.questions ?? []} />
      </div>
    </article>
  )
}
