// An idea's page on a project's page (R11, NCC-132's live slice): Back to
// Ideas, the title with its kind, state and tags, and the record's text as
// Markdown, which holds its open questions and links. Plain on every size for
// now; the frames (D09, T09, M09) and "Chat about this idea" are later
// issues'. Props only.
import { BackRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { MarkdownText } from '../../../blocks/MarkdownText.tsx'
import type { IdeaPage, ProjectPageWords } from '../types.ts'
import { type IdeaWords, ideaMeta } from './IdeasList.tsx'

const head = css({ display: 'flex', flexDirection: 'column', gap: '4', pt: '16', pb: '16' })
const title = css({ textStyle: 'heading', color: 'fg.default' })
const meta = css({ textStyle: 'small', color: 'fg.muted' })

/** The record's text without its first `# ` heading, which the page draws as its title. */
const bodyOf = (text: string) => text.replace(/^\s*#\s[^\n]*\n+/, '')

export type IdeaViewProps = {
  idea: IdeaPage
  words: IdeaWords & Pick<ProjectPageWords, 'ideaBack' | 'ideaBackLabel'>
  onBack?: (() => void) | undefined
}

export function IdeaView({ idea, words, onBack }: IdeaViewProps) {
  return (
    <article>
      <BackRow label={words.ideaBack} backLabel={words.ideaBackLabel} onBack={onBack} />
      <div className={head}>
        <h2 className={title}>{idea.row.title}</h2>
        <p className={meta}>{ideaMeta(idea.row, words)}</p>
      </div>
      <MarkdownText text={bodyOf(idea.body)} />
    </article>
  )
}
