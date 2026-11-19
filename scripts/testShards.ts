// Splits test files into CI shards by their measured time, so each shard
// takes about as long (Vitest's own split is by a hash of the path, which
// put 238 s of files in one shard and 113 s in the other). The times are in
// testShardTimes.json; `pnpm shard:times <run-id>` writes them from a CI run.

/** The CI time of each test file, by its path from the repo root, in ms. */
export type ShardTimes = { source: string; defaultMs: number; files: Record<string, number> }

/**
 * The paths that shard `index` (1 to `count`) runs. Longest file first, each
 * to the shard with the least time so far; a file with no time weighs
 * `defaultMs`. Every path goes to exactly one shard, and the same paths
 * give the same split on every runner.
 */
export function assignShard(
  paths: readonly string[],
  times: Readonly<Record<string, number>>,
  defaultMs: number,
  index: number,
  count: number,
): string[] {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 1 || index > count)
    throw new Error(`shard ${String(index)}/${String(count)}: the index must be a whole number from 1 to the count`)
  const weight = (p: string) => times[p] ?? defaultMs
  const order = [...new Set(paths)].sort((a, b) => weight(b) - weight(a) || (a < b ? -1 : a > b ? 1 : 0))
  const loads = Array.from({ length: count }, () => 0)
  const picked: string[] = []
  for (const path of order) {
    let best = 0
    for (let i = 1; i < count; i++) if ((loads[i] ?? 0) < (loads[best] ?? 0)) best = i
    loads[best] = (loads[best] ?? 0) + weight(path)
    if (best === index - 1) picked.push(path)
  }
  return picked
}

const esc = String.fromCharCode(27)
const ansi = new RegExp(`${esc}\\[[0-9;]*m`, 'g')
const fileLine =
  /^(?:\S+Z\s+)?\s*[✓×❯↓]\s+(\w+)\s+(\S+\.test\.tsx?)\s+\(\d+ tests?[^)]*\)\s+(\d+(?:\.\d+)?)\s*(ms|s)\s*$/

/**
 * Reads each file's time from the output of Vitest's default reporter (a CI
 * job log): `✓ web src/app/InboxRoute.test.tsx (88 tests) 94012ms` gives
 * `web/src/app/InboxRoute.test.tsx`: 94012. The project name is the folder.
 */
export function parseFileTimes(log: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const raw of log.split('\n')) {
    const m = fileLine.exec(raw.replace(ansi, ''))
    if (m === null) continue
    const [, project, file, n, unit] = m
    if (project === undefined || file === undefined || n === undefined) continue
    out[`${project}/${file}`] = Math.round(unit === 's' ? Number(n) * 1000 : Number(n))
  }
  return out
}
