// The stat tiles of a repository card (d-135): CI pass rate, PR merge time,
// CI run time, Open PRs and Drift findings, each its label, value and
// caption, as the frames word them. The desktop draws all five; a tablet or
// phone leaves out CI run time, as its frames do. A figure read with nothing
// to count shows "None" over the line that says why; one not read says so
// (the CI words while the first CI read runs or when it missed). A
// repository off GitHub has no tiles. Pure.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, RepositoryRow } from '../types.ts'

/** The words the tiles draw. */
export type StatWords = Pick<ProjectPageWords, 'stats' | 'ci' | 'counts' | 'unread'>

export type StatTile = {
  key: 'passRate' | 'mergeTime' | 'runTime' | 'openPulls' | 'drift'
  label: string
  value: string
  caption?: string | undefined
}

/** `text` with each `{name}` of `values` filled in. */
const fill = (text: string, values: Readonly<Record<string, string>>) =>
  Object.entries(values).reduce((out, [name, value]) => out.replaceAll(`{${name}}`, value), text)

/** Minutes to one decimal under 10, whole above, as the CI line wrote them. */
const minutesOf = (n: number) => (n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n)))
/** Hours to one decimal ("0.8"), as the frames write them. */
const hoursOf = (n: number) => n.toFixed(1)

/** The three CI tiles: from the CI numbers, or each with the CI line when the numbers are not there. */
function ciTiles(ci: NonNullable<RepositoryRow['ci']> | null, words: StatWords): StatTile[] {
  const { stats } = words
  const labels = { passRate: stats.passRate, mergeTime: stats.mergeTime, runTime: stats.runTime } as const
  const missing = (value: string) =>
    (['passRate', 'mergeTime', 'runTime'] as const).map((key) => ({ key, label: labels[key], value }))
  if (ci === null) return missing(words.ci.notRead)
  const { runs, merge, runMinutes, asOf } = ci
  if (runs === null || merge === null) return missing(words.ci.reading)
  const old = asOf === null ? [] : [fill(words.ci.asOf, { age: asOf })]
  const passed = runs.finished === 0 ? null : Math.round((runs.green / runs.finished) * 100)
  const passRuns = fill(stats.passRuns, { green: String(runs.green), finished: String(runs.finished) })
  return [
    {
      key: 'passRate',
      label: labels.passRate,
      value: passed === null ? stats.none : `${String(passed)}%`,
      caption: [passed === null ? words.ci.none : passRuns, ...old].join(' · '),
    },
    merge.medianHours === null
      ? { key: 'mergeTime', label: labels.mergeTime, value: stats.none, caption: stats.noMerge }
      : {
          key: 'mergeTime',
          label: labels.mergeTime,
          value: fill(stats.hours, { n: hoursOf(merge.medianHours) }),
          caption: merge.p90Hours === null ? undefined : fill(stats.mergeP90, { p90: hoursOf(merge.p90Hours) }),
        },
    runMinutes === null
      ? { key: 'runTime', label: labels.runTime, value: stats.none, caption: stats.noGreen }
      : {
          key: 'runTime',
          label: labels.runTime,
          value: fill(stats.minutes, { n: minutesOf(runMinutes) }),
          caption: stats.runMedian,
        },
  ]
}

/** The Open PRs tile: the count, or not read, over the worktree count. */
function pullsTile(row: RepositoryRow, words: StatWords): StatTile {
  const read = !row.unread.includes('pulls') && row.openPulls !== null
  const worktrees = row.unread.includes('worktrees')
    ? words.unread.worktrees
    : row.worktrees === null
      ? undefined
      : fill(row.worktrees === 1 ? words.counts.worktree : words.counts.worktrees, { n: String(row.worktrees) })
  const value = read ? String(row.openPulls) : words.stats.notRead
  return { key: 'openPulls', label: words.stats.openPulls, value, caption: worktrees }
}

/** The Drift findings tile: the last check's findings, none yet, a check that did not run, or not read. */
function driftTile(drift: RepositoryRow['drift'], { stats }: StatWords): StatTile {
  const tile = { key: 'drift', label: stats.drift } as const
  if (drift === undefined || drift === null) return { ...tile, value: stats.notRead }
  if (drift === 'unchecked') return { ...tile, value: stats.none, caption: stats.noCheck }
  if (drift === 'failed') return { ...tile, value: stats.none, caption: stats.checkFailed }
  return { ...tile, value: String(drift), caption: stats.driftAt }
}

/** The card's tiles in the frames' order; CI run time only on the desktop, and none off GitHub. */
export function statTiles(row: RepositoryRow, words: StatWords, layout: Viewport): StatTile[] {
  if (row.github === null) return []
  const tiles = [...ciTiles(row.ci ?? null, words), pullsTile(row, words), driftTile(row.drift, words)]
  return layout === 'desktop' ? tiles : tiles.filter((tile) => tile.key !== 'runTime')
}
