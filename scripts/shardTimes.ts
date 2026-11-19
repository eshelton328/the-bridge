#!/usr/bin/env node
// `pnpm shard:times <run-id>…`: writes scripts/testShardTimes.json, each
// file's mean time in the test-unit shard jobs of one or more the-bridge CI
// runs (gh must be signed in), so the shards stay even as tests change. It
// writes nothing when a shard job did not pass or has no file times.
// Prints one JSON line.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { shardTimesFromRuns, type ShardJobLog } from './testShards.ts'

const runIds = process.argv.slice(2)
if (runIds.length === 0 || !runIds.every((id) => /^\d+$/.test(id))) {
  console.error('Usage: pnpm shard:times <run-id>…')
  process.exit(2)
}
const gh = (...args: string[]) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const jobList = z.object({
  jobs: z.array(z.object({ id: z.number(), name: z.string(), conclusion: z.string().nullable() })),
})
const runs: Record<string, ShardJobLog[]> = {}
for (const runId of runIds) {
  const { jobs } = jobList.parse(JSON.parse(gh('api', `repos/{owner}/{repo}/actions/runs/${runId}/jobs?per_page=100`)))
  runs[runId] = jobs
    .filter((j) => j.name.startsWith('test-unit ('))
    .map((j) => ({
      name: j.name,
      conclusion: j.conclusion,
      log: j.conclusion === 'success' ? gh('api', `repos/{owner}/{repo}/actions/jobs/${String(j.id)}/logs`) : '',
    }))
}
let files: Record<string, number>
try {
  files = shardTimesFromRuns(runs)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
const ms = Object.values(files).sort((a, b) => a - b)
const defaultMs = Math.max(1, ms[Math.floor(ms.length / 2)] ?? 1)
const source = `mean of the test-unit shard jobs of the-bridge CI runs ${runIds.join(', ')}`
writeFileSync(
  fileURLToPath(new URL('testShardTimes.json', import.meta.url)),
  `${JSON.stringify({ source, defaultMs, files }, null, 2)}\n`,
)
console.log(JSON.stringify({ ok: true, source, files: ms.length, defaultMs }))
