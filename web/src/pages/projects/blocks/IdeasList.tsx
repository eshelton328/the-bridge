// The Ideas tab (R10): a compact `ListRow` for each idea record, with its kind,
// state and tags in the meta and its age at the end; a row opens its idea's
// page (R11). The search (title, tags, kind and state words) and the sort
// pick the rows, and the pager shows 10 of them at a time (NCC-132 AC1); a
// search or a sort goes back to page 1. Plain on every size for now; the
// frames' table (D08, T08, M08) is a later issue's. Props only.
import { ListRow, Pager, SearchField, SearchIcon, SelectField } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { IdeaRow, type ProjectIdeas, type ProjectPageWords } from '../types.ts'

const list = css({ display: 'flex', flexDirection: 'column' })
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', pt: '12' })
const tools = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12', pt: '12', pb: '12' })
const pageSizes = [10, 25, 50] as const

/** The words the list draws. */
export type IdeaWords = Pick<ProjectPageWords, 'ideas' | 'noIdeas' | 'ideaKinds' | 'ideaStates' | 'ideaTools'>
type Sort = keyof ProjectPageWords['ideaTools']['sorts']

export type IdeasListProps = {
  ideas: ProjectIdeas
  words: IdeaWords
  layout: Viewport
  onOpen?: ((id: string) => void) | undefined
}

/** The row's meta: its kind, state and tags, as one line. */
export const ideaMeta = (idea: IdeaRow, words: Pick<IdeaWords, 'ideaKinds' | 'ideaStates'>) =>
  [words.ideaKinds[idea.kind], words.ideaStates[idea.state], ...idea.tags].join(' · ')

/** `rows` in the order of `sort`; Updated is the server's order (newest change first), and a tie keeps it. */
function sorted(rows: IdeaRow[], sort: Sort): IdeaRow[] {
  if (sort === 'updated') return rows
  const kinds = IdeaRow.shape.kind.options
  const states = IdeaRow.shape.state.options
  const key = (r: IdeaRow) => (sort === 'kind' ? kinds.indexOf(r.kind) : states.indexOf(r.state))
  return rows.toSorted((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : key(a) - key(b)))
}

export function IdeasList({ ideas, words, layout, onOpen }: IdeasListProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('updated')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(pageSizes[0])
  if (ideas.notRead !== undefined)
    return (
      <p role="status" className={line}>
        {ideas.notRead}
      </p>
    )
  if (ideas.rows.length === 0) return <p className={line}>{words.noIdeas}</p>
  const text = query.trim().toLowerCase()
  const shown = sorted(
    ideas.rows.filter((i) => text === '' || ideaText(i, words).includes(text)),
    sort,
  )
  const at = Math.min(page, Math.max(1, Math.ceil(shown.length / pageSize)))
  const sorts = Object.entries(words.ideaTools.sorts).map(([value, label]) => ({ value, label }))
  return (
    <div>
      <div className={tools}>
        <SearchField
          label={words.ideaTools.search}
          placeholder={words.ideaTools.search}
          icon={<SearchIcon />}
          value={query}
          onValueChange={(next) => {
            setQuery(next)
            setPage(1)
          }}
        />
        <SelectField
          label={words.ideaTools.sort}
          options={sorts}
          value={sort}
          onValueChange={(next) => {
            const picked = sortOf(next)
            if (picked === undefined) return
            setSort(picked)
            setPage(1)
          }}
        />
      </div>
      {shown.length === 0 ? <p className={line}>{words.ideaTools.noMatch}</p> : null}
      <ul className={list} aria-label={words.ideas}>
        {shown.slice((at - 1) * pageSize, at * pageSize).map((idea) => (
          <li key={idea.id}>
            <ListRow
              density="compact"
              padding={layout === 'phone' ? 'phoneSides' : undefined}
              title={idea.title}
              meta={ideaMeta(idea, words)}
              trailing={idea.age}
              onSelect={() => onOpen?.(idea.id)}
            />
          </li>
        ))}
      </ul>
      {shown.length === 0 ? null : (
        <Pager
          page={at}
          pageSize={pageSize}
          total={shown.length}
          onPageChange={setPage}
          pageSizes={pageSizes}
          onPageSizeChange={(next) => {
            setPageSize(next)
            setPage(1)
          }}
          size={layout}
        />
      )}
    </div>
  )
}

/** The text a search matches: the title, the tags and the kind and state words, in lower case. */
const ideaText = (idea: IdeaRow, words: IdeaWords) => `${idea.title} ${ideaMeta(idea, words)}`.toLowerCase()

const sortNames: readonly Sort[] = ['updated', 'title', 'kind', 'state']
/** The sort `value` names, or none for a value the field does not offer. */
const sortOf = (value: string): Sort | undefined => sortNames.find((s) => s === value)
