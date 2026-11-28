// The Repositories tab (f-008 increment two, R2, R8; d-135): one card for each
// repository in `project.yaml` order, each its head (name, visibility, role,
// Architecture and View on GitHub) and its stat tiles; the line of a read
// that missed, or of no repository. The first card starts 28 under the tabs
// (their 12 gap and 16 here); the cards sit 32 apart, each after the first
// under a rule 32 over its head, as D02 draws them. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, ProjectRepositories } from '../types.ts'
import { RepositoryCard, type RepositoryCardWords } from './RepositoryCard.tsx'

const list = css({ display: 'flex', flexDirection: 'column', gap: '32', pt: '16' })
const item = css({
  '& + &': { pt: '32', borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' },
})
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', pt: '12' })

/** The words the list draws. */
type RepositoryWords = RepositoryCardWords & Pick<ProjectPageWords, 'repositories' | 'noRepositories'>

export type RepositoriesListProps = {
  repositories: ProjectRepositories
  words: RepositoryWords
  layout: Viewport
  /** Opens the Architecture tab on a repository. */
  onArchitecture?: ((repo: string) => void) | undefined
}

export function RepositoriesList({ repositories, words, layout, onArchitecture }: RepositoriesListProps) {
  if (repositories.notRead !== undefined)
    return (
      <p role="status" className={line}>
        {repositories.notRead}
      </p>
    )
  if (repositories.rows.length === 0) return <p className={line}>{words.noRepositories}</p>
  return (
    <ul className={list} aria-label={words.repositories}>
      {repositories.rows.map((row) => (
        <li key={row.id} className={item}>
          <RepositoryCard row={row} words={words} layout={layout} onArchitecture={onArchitecture} />
        </li>
      ))}
    </ul>
  )
}
