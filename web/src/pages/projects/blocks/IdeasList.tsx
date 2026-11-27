// The Ideas tab (R10): a compact `ListRow` for each idea record, with its kind,
// state and tags in the meta and its age at the end. Plain on every size for
// now; the frames' table (D08, T08, M08) is a later issue's. Props only.
import { ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { IdeaRow, ProjectIdeas, ProjectPageWords } from '../types.ts'

const list = css({ display: 'flex', flexDirection: 'column', pt: '12' })
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', pt: '12' })

/** The words the list draws. */
export type IdeaWords = Pick<ProjectPageWords, 'ideas' | 'noIdeas' | 'ideaKinds' | 'ideaStates'>

export type IdeasListProps = {
  ideas: ProjectIdeas
  words: IdeaWords
  layout: Viewport
}

/** The row's meta: its kind, state and tags, as one line. */
const ideaMeta = (idea: IdeaRow, words: IdeaWords) =>
  [words.ideaKinds[idea.kind], words.ideaStates[idea.state], ...idea.tags].join(' · ')

export function IdeasList({ ideas, words, layout }: IdeasListProps) {
  if (ideas.notRead !== undefined)
    return (
      <p role="status" className={line}>
        {ideas.notRead}
      </p>
    )
  if (ideas.rows.length === 0) return <p className={line}>{words.noIdeas}</p>
  return (
    <ul className={list} aria-label={words.ideas}>
      {ideas.rows.map((idea) => (
        <li key={idea.id}>
          <ListRow
            density="compact"
            padding={layout === 'phone' ? 'phoneSides' : undefined}
            title={idea.title}
            meta={ideaMeta(idea, words)}
            trailing={idea.age}
          />
        </li>
      ))}
    </ul>
  )
}
