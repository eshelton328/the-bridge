// The Architecture runner on the server's snapshots (f-008 increment two, A1b):
// a repository scope syncs that repository's snapshot and reads its diagram from
// the snapshot's files, both under the snapshot's lock, which the drift check
// holds too. The commit is the snapshot's. A repository off GitHub has no
// snapshot ('no-github'), and `@system`, which joins the repositories, comes
// with A2 ('not-built'). A fault is its code only.
import { type ArchitectureModel, systemScope } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { ArchitectureRunner } from './architecture.ts'
import type { ProjectFault, SnapshotSource } from './projects.ts'
import { type SnapshotLock, snapshotKey } from './snapshotLock.ts'

/** Reads a diagram from a snapshot folder (for the adapters only), with the IDs of the project's other repositories. */
export type SnapshotReader = {
  read(dir: string, others?: readonly string[]): Promise<Result<ArchitectureModel, ProjectFault>>
}

export function createSnapshotRunner({
  snapshots,
  lock,
  reader,
}: {
  readonly snapshots: SnapshotSource
  readonly lock: SnapshotLock
  readonly reader: SnapshotReader
}): ArchitectureRunner {
  return {
    run({ scope, repositories }) {
      if (scope === systemScope) return Promise.resolve(err({ reason: 'failed', code: 'not-built' }))
      const github = repositories.find((r) => r.id === scope)?.github
      if (github === undefined) return Promise.resolve(err({ reason: 'failed', code: 'no-repository' }))
      if (github === null) return Promise.resolve(err({ reason: 'failed', code: 'no-github' }))
      return lock.hold(snapshotKey(github), async () => {
        const snapshot = await snapshots.sync(github)
        if (!snapshot.ok) return snapshot
        const others = repositories.flatMap((r) => (r.id === scope ? [] : [r.id]))
        const model = await reader.read(snapshot.value.dir, others)
        if (!model.ok) return model
        return ok({ model: model.value, commit: snapshot.value.commit })
      })
    },
  }
}
