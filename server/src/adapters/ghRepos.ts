// A GitHub repository's visibility and newest release (f-008 increment two,
// R2), from one read-only `gh api graphql` call run as ghPulls.ts runs gh.
// The newest release counts pre-releases, as the library's releases all are;
// a release with no publish time (a draft) is none.
import { RepositoryRelease, RepositoryVisibility } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { z } from 'zod'
import type { RepositoryFacts } from '../services/projects.ts'
import { type GhOptions, runGh } from './ghPulls.ts'

const query = [
  'query($owner: String!, $name: String!) {',
  '  repository(owner: $owner, name: $name) {',
  '    visibility',
  '    releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) { nodes { tagName url publishedAt } }',
  '  }',
  '}',
].join('\n')

const Reply = z.object({
  data: z.object({
    repository: z.object({
      visibility: z.string(),
      releases: z.object({
        nodes: z.array(z.object({ tagName: z.string(), url: z.string(), publishedAt: z.string().nullable() })),
      }),
    }),
  }),
})

export function createGhRepositoryFacts(options: GhOptions): RepositoryFacts {
  return {
    async about({ owner, name }) {
      const args = ['api', 'graphql', '-f', `query=${query}`, '-f', `owner=${owner}`, '-f', `name=${name}`]
      const read = await runGh(options, args, Reply)
      if (!read.ok) return read
      const repository = read.value.data.repository
      const visibility = RepositoryVisibility.safeParse(repository.visibility.toLowerCase())
      if (!visibility.success) return err({ reason: 'failed', code: 'EBADDATA' })
      const newest = repository.releases.nodes[0]
      const release = RepositoryRelease.safeParse(
        newest === undefined || newest.publishedAt === null
          ? null
          : { tag: newest.tagName, url: newest.url, publishedAt: new Date(newest.publishedAt).toISOString() },
      )
      return ok({ visibility: visibility.data, release: release.success ? release.data : null })
    },
  }
}
