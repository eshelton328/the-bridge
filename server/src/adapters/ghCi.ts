// A GitHub repository's CI runs, merged PRs and jobs (f-008 increment two,
// R4, R6), from read-only `gh api -X GET` calls run as ghPulls.ts runs gh.
// Each list comes in pages of 100, at most 10 pages, so a busy repository
// costs at most 10 calls a list. The pages after the first and the job
// reads run at once, but at most `maxParallel` gh calls of one adapter run
// at a time, so the Mac and GitHub's limit on parallel requests are spared.
import { ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { ProjectFault } from '../services/projects.ts'
import { type CiSource, maxWorkflowRuns } from '../services/repositoryCi.ts'
import { type GhOptions, runGh } from './ghPulls.ts'

const pageSize = 100
const maxPages = maxWorkflowRuns / pageSize
const maxParallel = 3

/**
 * A gate that lets at most `limit` tasks run at once, the others in turn. A task that ends gives its place to the
 * next waiting one, so no new task can take the place between them.
 */
function gate(limit: number) {
  let active = 0
  const waiting: (() => void)[] = []
  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= limit) await new Promise<void>((resolve) => waiting.push(resolve))
    else active++
    try {
      return await task()
    } finally {
      const next = waiting.shift()
      if (next === undefined) active--
      else next()
    }
  }
}

const Runs = z.object({
  total_count: z.number().int(),
  workflow_runs: z.array(
    z.object({
      id: z.number().int(),
      head_sha: z.string(),
      event: z.string(),
      head_branch: z.string().nullable(),
      conclusion: z.string().nullable(),
      run_started_at: z.iso.datetime({ offset: true }),
      updated_at: z.iso.datetime({ offset: true }),
    }),
  ),
})
const Search = z.object({
  total_count: z.number().int(),
  items: z.array(
    z.object({
      created_at: z.iso.datetime({ offset: true }),
      pull_request: z.object({ merged_at: z.string().nullable() }),
    }),
  ),
})
const Jobs = z.object({
  total_count: z.number().int(),
  jobs: z.array(
    z.object({
      name: z.string(),
      conclusion: z.string().nullable(),
      started_at: z.iso.datetime({ offset: true }),
      completed_at: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
})

/** The first page of one GET list, then the rest that its `total_count` names at once, at most `maxPages` in all. */
async function pages<T extends { readonly total_count: number }, I>(
  limited: ReturnType<typeof gate>,
  options: GhOptions,
  path: string,
  fields: readonly string[],
  schema: z.ZodType<T>,
  items: (page: T) => readonly I[],
): Promise<Result<I[], ProjectFault>> {
  const read = (page: number) =>
    limited(() =>
      runGh(
        options,
        [
          'api',
          '-X',
          'GET',
          path,
          '-f',
          `per_page=${String(pageSize)}`,
          '-f',
          `page=${String(page)}`,
          ...fields.flatMap((f) => ['-f', f]),
        ],
        schema,
      ),
    )
  const first = await read(1)
  if (!first.ok) return first
  const count = Math.min(maxPages, Math.ceil(first.value.total_count / pageSize))
  const rest = await Promise.all(Array.from({ length: Math.max(0, count - 1) }, (_, i) => read(i + 2)))
  const all = [...items(first.value)]
  for (const page of rest) {
    if (!page.ok) return page
    all.push(...items(page.value))
  }
  return ok(all)
}

export function createGhCi(options: GhOptions): CiSource {
  const limited = gate(maxParallel)
  return {
    async runs({ owner, name }, since) {
      const read = await pages(
        limited,
        options,
        `repos/${owner}/${name}/actions/runs`,
        [`created=>=${since}`],
        Runs,
        (p) => p.workflow_runs,
      )
      if (!read.ok) return read
      return ok(
        read.value.map((r) => ({
          id: r.id,
          sha: r.head_sha,
          event: r.event,
          branch: r.head_branch ?? '',
          conclusion: r.conclusion,
          startedAt: new Date(r.run_started_at).toISOString(),
          updatedAt: new Date(r.updated_at).toISOString(),
        })),
      )
    },
    async merged({ owner, name }, since) {
      const q = `q=repo:${owner}/${name} is:pr is:merged merged:>=${since.slice(0, 10)}`
      const read = await pages(limited, options, 'search/issues', [q], Search, (p) => p.items)
      if (!read.ok) return read
      return ok(
        read.value.flatMap((p) => {
          const mergedAt = p.pull_request.merged_at
          return mergedAt === null || Number.isNaN(Date.parse(mergedAt))
            ? []
            : [{ createdAt: p.created_at, mergedAt: new Date(mergedAt).toISOString() }]
        }),
      )
    },
    async jobs({ owner, name }, run) {
      const read = await pages(
        limited,
        options,
        `repos/${owner}/${name}/actions/runs/${String(run)}/jobs`,
        [],
        Jobs,
        (p) => p.jobs,
      )
      if (!read.ok) return read
      return ok(
        read.value.map((j) => ({
          name: j.name,
          conclusion: j.conclusion,
          minutes:
            j.completed_at === null
              ? null
              : Math.max(0, Date.parse(j.completed_at) - Date.parse(j.started_at)) / 60_000,
        })),
      )
    },
  }
}
