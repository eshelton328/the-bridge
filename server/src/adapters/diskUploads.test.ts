import { mkdtempSync, readdirSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { ChatId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createDiskUploads } from './diskUploads.ts'
import { describeUploadStore } from './uploadStoreContract.ts'

const newRoot = () => join(mkdtempSync(join(tmpdir(), 'bridge-uploads-')), 'uploads')

describeUploadStore('disk', () => {
  const store = createDiskUploads({ root: newRoot(), chunkSize: 4 })
  return Promise.resolve({
    store,
    file: async (upload) => {
      const path = await store.pathOf(upload)
      return path === null ? null : { name: basename(path), bytes: await readFile(path) }
    },
  })
})

describe('the disk upload store', () => {
  it('makes its folders 0700 and its files 0600, so only the owner reads them', async () => {
    const root = newRoot()
    const store = createDiskUploads({ root, chunkSize: 4 })
    const upload = await store.start(ChatId.parse('test-mac/chat-a'), 'a.txt', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    const bytes = async function* () {
      yield await Promise.resolve(new TextEncoder().encode('ab'))
    }
    await store.writeChunk(upload.value, 0, bytes())
    await store.complete(upload.value)
    const mode = (path: string) => statSync(path).mode & 0o777
    expect(mode(root)).toBe(0o700)
    expect(mode(join(root, upload.value))).toBe(0o700)
    expect(mode(join(root, upload.value, 'file'))).toBe(0o700)
    for (const name of readdirSync(join(root, upload.value)).filter((n) => n !== 'file'))
      expect(mode(join(root, upload.value, name))).toBe(0o600)
    expect(mode(join(root, upload.value, 'file', 'a.txt'))).toBe(0o600)
  })

  it('reads an upload that another server process started, from its state file', async () => {
    const root = newRoot()
    const first = createDiskUploads({ root, chunkSize: 4 })
    const upload = await first.start(ChatId.parse('test-mac/chat-a'), 'a.txt', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    const second = createDiskUploads({ root, chunkSize: 4 })
    const bytes = async function* () {
      yield await Promise.resolve(new TextEncoder().encode('ab'))
    }
    expect(await second.writeChunk(upload.value, 0, bytes())).toEqual({ ok: true, value: 'written' })
  })
})
