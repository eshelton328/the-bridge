// The QA tab (f-008 increment three; the live slice, NCC-155): a group for
// Before merge and for After merge, each a list of compact `ListRow` rows
// (issue and `<repository>#<pr>`, then status and worktree, after the meta
// on the phone). The frames' tables are later PRs'. Props only.
import { ListRow } from '@eshelton328/component-library-1701'
import type { QaItem, QaPhase } from '@bridge/contract'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, ProjectQa } from '../types.ts'

const list = css({ display: 'flex', flexDirection: 'column' })
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', pt: '12' })

/** The words the list draws. */
type QaWords = Pick<ProjectPageWords, 'noQa' | 'qaGroups' | 'qaStatuses' | 'qaWorktrees'>

export type QaListProps = {
  qa: ProjectQa
  words: QaWords
  layout: Viewport
}

const phases: readonly QaPhase[] = ['beforeMerge', 'afterMerge']

/** The row's meta: its issue ID, then `<repository>#<pr>` when the ask names both. */
const metaOf = (row: QaItem) =>
  [row.issue, row.repository !== null && row.pr !== null ? `${row.repository}#${String(row.pr)}` : null]
    .filter((part) => part !== null)
    .join(' · ')

export function QaList({ qa, words, layout }: QaListProps) {
  if (qa.notRead !== undefined)
    return (
      <p role="status" className={line}>
        {qa.notRead}
      </p>
    )
  if (qa.rows.length === 0) return <p className={line}>{words.noQa}</p>
  const phone = layout === 'phone'
  return (
    <div>
      {phases.map((phase) => {
        const rows = qa.rows.filter((row) => row.phase === phase)
        if (rows.length === 0) return null
        const id = `qa-${phase}`
        return (
          <section key={phase} aria-labelledby={id}>
            <h3 id={id} className={line}>
              {words.qaGroups[phase]}
            </h3>
            <ul className={list} aria-label={words.qaGroups[phase]}>
              {rows.map((row) => {
                const meta = metaOf(row)
                const end = [words.qaStatuses[row.status], words.qaWorktrees[row.worktree]].join(' · ')
                return (
                  <li key={row.issue}>
                    <ListRow
                      density="compact"
                      padding={phone ? 'phoneSides' : undefined}
                      title={row.title}
                      meta={phone ? `${meta} · ${end}` : meta}
                      trailing={phone ? undefined : end}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
