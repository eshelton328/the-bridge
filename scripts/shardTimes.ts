#!/usr/bin/env node
// `pnpm shard:times <run-id>`: writes scripts/testShardTimes.json from the
// test-unit shard jobs of a the-bridge CI run (gh must be signed in), so
// the shards stay even as tests change. Prints one JSON line.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { parseFileTimes } from './testShards.ts'

const runId = process.argv[2]
if (runId === undefined || !/^\d+$/.test(runId)) {
  console.error('Usage: pnpm shard:times <run-id>')
  process.exit(2)
}
const gh = (...args: string[]) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
const jobs = z
  .object({ jobs: z.array(z.object({ id: z.number(), name: z.string() })) })
  .parse(JSON.parse(gh('api', `repos/{owner}/{repo}/actions/runs/${runId}/jobs?per_page=100`)))
  .jobs.filter((j) => j.name.startsWith('test-unit ('))
if (jobs.length === 0) {
  console.error(`Run ${runId} has no test-unit shard job.`)
  process.exit(1)
}
const files: Record<string, number> = {}
for (const job of jobs)
  Object.assign(files, parseFileTimes(gh('api', `repos/{owner}/{repo}/actions/jobs/${String(job.id)}/logs`)))
const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)))
const ms = Object.values(sorted).sort((a, b) => a - b)
const defaultMs = Math.max(1, ms[Math.floor(ms.length / 2)] ?? 1)
const source = `the-bridge CI run ${runId}, jobs ${jobs.map((j) => j.name).join(', ')}`
writeFileSync(
  fileURLToPath(new URL('testShardTimes.json', import.meta.url)),
  `${JSON.stringify({ source, defaultMs, files: sorted }, null, 2)}\n`,
)
console.log(JSON.stringify({ ok: true, source, files: ms.length, defaultMs }))
