// The Repositories tab (f-008 increment two, R2, R8): a compact `ListRow` for
// each repository, with its role, visibility and newest release in the meta and
// its open PR and worktree counts at the end (on the phone, after the meta, so
// the role keeps the row's width); a part not read says so. Plain on
// every size for now; the frames' sections, tiles and panels (D20 to M20) are
// later PRs'. Props only.
import { ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, ProjectRepositories, RepositoryRow } from '../types.ts'

const list = css({ display: 'flex', flexDirection: 'column', pt: '12' })
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', pt: '12' })
// The CI numbers' own line under the meta, which wraps, so a narrow row never pushes them over its text.
const ciLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted', overflowWrap: 'anywhere' })

/** The words the list draws. */
type RepositoryWords = Pick<
  ProjectPageWords,
  'repositories' | 'noRepositories' | 'visibility' | 'counts' | 'unread' | 'ci'
>

export type RepositoriesListProps = {
  repositories: ProjectRepositories
  words: RepositoryWords
  layout: Viewport
}

const count = (n: number, one: string, many: string) => (n === 1 ? one : many).replace('{n}', String(n))

/** The row's meta: its role, then its visibility and newest release, or the line of GitHub's facts not read. */
function metaOf(row: RepositoryRow, words: RepositoryWords): string {
  const github = row.unread.includes('about')
    ? [words.unread.about]
    : [row.visibility === null ? null : words.visibility[row.visibility], row.release]
  return [row.role, ...github].filter((part) => part !== null && part !== '').join(' · ')
}

/** A green run's median minutes, to one decimal under 10. */
const minutesOf = (n: number) => (n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n)))

/** The row's CI line (R4): green of finished, the minutes and the read's age; or its line; none off GitHub. */
function ciOf(row: RepositoryRow, words: RepositoryWords): string | null {
  const { ci } = words
  if (row.ci === undefined) return null
  if (row.ci === null) return ci.notRead
  const { runs, runMinutes, asOf } = row.ci
  if (runs === null) return ci.reading
  const parts = [
    runs.finished === 0
      ? ci.none
      : ci.runs.replace('{green}', String(runs.green)).replace('{finished}', String(runs.finished)),
    runMinutes === null ? null : ci.minutes.replace('{n}', minutesOf(runMinutes)),
    asOf === null ? null : ci.asOf.replace('{age}', asOf),
  ]
  return parts.filter((part) => part !== null).join(' · ')
}

/** The row's end: the open PRs and the worktrees, each as a count or its line not read; none off GitHub. */
function countsOf(row: RepositoryRow, words: RepositoryWords): string {
  const { counts, unread } = words
  const pulls = row.unread.includes('pulls')
    ? unread.pulls
    : row.openPulls === null
      ? null
      : count(row.openPulls, counts.openPull, counts.openPulls)
  const worktrees = row.unread.includes('worktrees')
    ? unread.worktrees
    : row.worktrees === null
      ? null
      : count(row.worktrees, counts.worktree, counts.worktrees)
  return [pulls, worktrees].filter((part) => part !== null).join(' · ')
}

export function RepositoriesList({ repositories, words, layout }: RepositoriesListProps) {
  if (repositories.notRead !== undefined)
    return (
      <p role="status" className={line}>
        {repositories.notRead}
      </p>
    )
  if (repositories.rows.length === 0) return <p className={line}>{words.noRepositories}</p>
  return (
    <ul className={list} aria-label={words.repositories}>
      {repositories.rows.map((row) => {
        const meta = metaOf(row, words)
        const counts = countsOf(row, words)
        const ci = ciOf(row, words)
        const phone = layout === 'phone'
        return (
          <li key={row.id}>
            <ListRow
              density="compact"
              padding={phone ? 'phoneSides' : undefined}
              title={row.id}
              meta={phone ? [meta, counts].filter((part) => part !== '').join(' · ') : meta}
              trailing={phone ? undefined : counts}
            >
              {ci === null ? null : <span className={ciLine}>{ci}</span>}
            </ListRow>
          </li>
        )
      })}
    </ul>
  )
}
