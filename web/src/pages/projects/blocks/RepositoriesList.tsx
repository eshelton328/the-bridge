// The Repositories tab (f-008 increment two, R2, R8; d-135): one card for each
// repository in `project.yaml` order, each its head (name, visibility, role,
// Architecture and View on GitHub) and its stat tiles; the line of a read
// that missed, or of no repository. The cards sit 32 apart. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, ProjectRepositories } from '../types.ts'
import { RepositoryCard, type RepositoryCardWords } from './RepositoryCard.tsx'

const list = css({ display: 'flex', flexDirection: 'column', gap: '32', pt: '12' })
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
        <li key={row.id}>
          <RepositoryCard row={row} words={words} layout={layout} onArchitecture={onArchitecture} />
        </li>
      ))}
    </ul>
  )
}
