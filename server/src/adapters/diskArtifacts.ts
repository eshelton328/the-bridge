// The artifacts library on disk (R26): library.json in a 0700 folder beside
// the database, 0600 and replaced in one rename. A file that the schema
// does not take is a fault (`EBADDATA`), never read as an empty library,
// so a save cannot write over it. A fault gives its errno code only; no
// link or title goes into a log or an error.
import { randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Artifact } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { z } from 'zod'
import type { ArtifactLibrary, ArtifactStore } from '../services/artifacts.ts'

const Stored = z.object({
  lastSeenAt: z.iso.datetime().nullable(),
  artifacts: z.array(z.object({ artifact: Artifact, removed: z.boolean() })),
})

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

export function createDiskArtifactStore(root: string): ArtifactStore {
  const path = join(root, 'library.json')
  return {
    async load() {
      let text: string
      try {
        text = await readFile(path, 'utf8')
      } catch (thrown) {
        if (codeOf(thrown) === 'ENOENT') return ok({ lastSeenAt: null, artifacts: [] })
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch {
        return err({ reason: 'failed', code: 'EBADDATA' })
      }
      const parsed = Stored.safeParse(raw)
      if (!parsed.success) return err({ reason: 'failed', code: 'EBADDATA' })
      const library: ArtifactLibrary = {
        lastSeenAt: parsed.data.lastSeenAt,
        artifacts: parsed.data.artifacts.map((a) => ({ ...a.artifact, removed: a.removed })),
      }
      return ok(library)
    },
    async save(library) {
      let temporary: string | undefined
      try {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        const stored = {
          lastSeenAt: library.lastSeenAt,
          artifacts: library.artifacts.map(({ removed, ...artifact }) => ({ artifact, removed })),
        }
        temporary = `${path}.${randomUUID()}.tmp`
        await writeFile(temporary, JSON.stringify(stored), { mode: 0o600 })
        await rename(temporary, path)
        return ok(undefined)
      } catch (thrown) {
        // A failed write or rename must not leave its temporary file, or each retry adds one.
        if (temporary !== undefined) await rm(temporary, { force: true }).catch(() => undefined)
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
    },
  }
}
