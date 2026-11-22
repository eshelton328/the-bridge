import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ArtifactId, ChatId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { ArtifactLibrary } from '../services/artifacts.ts'
import { createDiskArtifactStore } from './diskArtifacts.ts'

const library: ArtifactLibrary = {
  lastSeenAt: '2026-11-21T12:00:00.000Z',
  artifacts: [
    {
      id: ArtifactId.parse('0123456789abcdef'),
      link: 'https://claude.ai/artifact/Example_Artifact-0001',
      source: 'claude',
      title: 'Example report',
      description: '',
      project: 'example-project',
      chat: ChatId.parse('test-mac/0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'),
      publishedAt: '2026-11-20T10:00:00.000Z',
      foundAt: '2026-11-20T10:05:00.000Z',
      foundBy: 'session',
      removed: true,
    },
  ],
}

describe('the artifacts store on disk', () => {
  it('gives an empty library before the first save, then what it saved, in a 0700 folder with a 0600 file', async () => {
    const root = join(mkdtempSync(join(tmpdir(), 'bridge-artifacts-')), 'artifacts')
    const store = createDiskArtifactStore(root)
    expect(await store.load()).toEqual({ ok: true, value: { lastSeenAt: null, artifacts: [] } })
    expect(await store.save(library)).toEqual({ ok: true, value: undefined })
    expect(await createDiskArtifactStore(root).load()).toEqual({ ok: true, value: library })
    expect(statSync(root).mode & 0o777).toBe(0o700)
    expect(statSync(join(root, 'library.json')).mode & 0o777).toBe(0o600)
  })

  it('gives a file the schema does not take as a fault, and does not read it as empty', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bridge-artifacts-'))
    for (const text of [
      'not json',
      JSON.stringify({ lastSeenAt: null, artifacts: [{ artifact: { link: 'x' }, removed: false }] }),
    ]) {
      writeFileSync(join(root, 'library.json'), text)
      expect(await createDiskArtifactStore(root).load()).toEqual({
        ok: false,
        error: { reason: 'failed', code: 'EBADDATA' },
      })
    }
    expect(readFileSync(join(root, 'library.json'), 'utf8')).toContain('"x"')
  })

  it('gives a write fault as its errno code only', async () => {
    const base = mkdtempSync(join(tmpdir(), 'bridge-artifacts-'))
    writeFileSync(join(base, 'file'), '')
    const saved = await createDiskArtifactStore(join(base, 'file', 'artifacts')).save(library)
    expect(saved).toEqual({ ok: false, error: { reason: 'failed', code: 'ENOTDIR' } })
  })

  it('removes its temporary file when the rename fails', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bridge-artifacts-'))
    mkdirSync(join(root, 'library.json'))
    writeFileSync(join(root, 'library.json', 'keep'), '')
    const saved = await createDiskArtifactStore(root).save(library)
    expect(saved.ok).toBe(false)
    expect(readdirSync(root)).toEqual(['library.json'])
  })
})
