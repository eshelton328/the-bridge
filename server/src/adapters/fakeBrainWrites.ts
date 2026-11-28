// The BrainWrites fake: the projects folders as a set of slugs in memory; `busy` answers each write as a locked index.
import { err, ok } from '@bridge/shared'
import type { BrainWrites, NewProject } from '../services/brainWrites.ts'

export type FakeBrainWrites = BrainWrites & {
  /** Each project that a create made, in order. */
  readonly created: NewProject[]
  busy: boolean
}

export function createFakeBrainWrites(taken: Iterable<string> = []): FakeBrainWrites {
  const folders = new Set(taken)
  const fake: FakeBrainWrites = {
    created: [],
    busy: false,
    taken: (slug) => Promise.resolve(ok(folders.has(slug))),
    createProject(project) {
      if (fake.busy) return Promise.resolve(err({ reason: 'busy' as const }))
      if (folders.has(project.slug)) return Promise.resolve(ok('taken' as const))
      folders.add(project.slug)
      fake.created.push(project)
      return Promise.resolve(ok('created' as const))
    },
  }
  return fake
}
