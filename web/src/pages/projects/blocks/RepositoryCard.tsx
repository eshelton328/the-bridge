// One repository of the Repositories tab (d-135): its head and its stat
// tiles, 16 apart, with no box of its own, as the frames draw the card. The
// tiles are the library's `KpiTile` in a `Grid` 12 apart: five in a row on
// the desktop, four on a tablet and two by two on the phone. A repository off
// GitHub has no tiles; its worktree count shows under the head. The Open PRs
// list, the CI job bars and the drift groups are a later PR's. Props only.
import { Grid, KpiTile } from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, RepositoryRow } from '../types.ts'
import { RepositoryHead } from './RepositoryHead.tsx'
import { statTiles } from './repositoryStats.ts'

const card = css({ display: 'flex', flexDirection: 'column', gap: '16' })
const line = css({ textStyle: 'small', color: 'fg.muted' })

/** The words the card draws. */
export type RepositoryCardWords = Pick<
  ProjectPageWords,
  'visibility' | 'unread' | 'architecture' | 'repository' | 'stats' | 'ci' | 'counts'
>

export type RepositoryCardProps = {
  row: RepositoryRow
  words: RepositoryCardWords
  layout: Viewport
  onArchitecture?: ((repo: string) => void) | undefined
}

/** The worktree count of a repository off GitHub, or its line not read; none when the server gives none. */
function worktreesOf(row: RepositoryRow, words: RepositoryCardWords): string | null {
  if (row.unread.includes('worktrees')) return words.unread.worktrees
  if (row.worktrees === null) return null
  return (row.worktrees === 1 ? words.counts.worktree : words.counts.worktrees).replace('{n}', String(row.worktrees))
}

export function RepositoryCard({ row, words, layout, onArchitecture }: RepositoryCardProps) {
  const nameId = useId()
  const tiles = statTiles(row, words, layout)
  const worktrees = row.github === null ? worktreesOf(row, words) : null
  const columns = layout === 'desktop' ? '5' : layout === 'tablet' ? '4' : '2'
  return (
    <section className={card} aria-labelledby={nameId} data-figma={`repository card · ${row.id}`}>
      <RepositoryHead row={row} words={words} layout={layout} nameId={nameId} onArchitecture={onArchitecture} />
      {tiles.length === 0 ? null : (
        <Grid columns={columns} gap="12" data-figma="stat row">
          {tiles.map((tile) => (
            <div key={tile.key} data-figma={`stat · ${tile.label}`}>
              <KpiTile label={tile.label} value={tile.value} caption={tile.caption} captionLines={2} />
            </div>
          ))}
        </Grid>
      )}
      {worktrees === null ? null : <p className={line}>{worktrees}</p>}
    </section>
  )
}
