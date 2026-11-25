import { ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import type { FileStore } from './fileStore.ts'
import { createFiles, fileIdOf } from './files.ts'

// A store of one file with the given bytes, to test the text read's checks on bytes that the fake's text cannot hold.
const storeOf = (bytes: Uint8Array): FileStore => ({
  list: () => Promise.resolve(ok(['notes/a.md', '../out.md', '/abs.md'])),
  read: () => Promise.resolve(ok(bytes)),
})
const id = fileIdOf('brain', 'notes/a.md')

describe('createFiles', () => {
  it('reads UTF-8 text', async () => {
    const read = await createFiles(storeOf(new TextEncoder().encode('é ok'))).text('brain', id)
    expect(read).toEqual({ ok: true, value: { id, path: 'notes/a.md', text: 'é ok' } })
  })

  it.each([
    ['bad UTF-8', new Uint8Array([0x61, 0xff, 0x62])],
    ['a NUL in the first 8 KiB', new Uint8Array([0x61, 0x00, 0x62])],
  ])('calls a file with %s binary', async (_, bytes) => {
    expect(await createFiles(storeOf(bytes)).text('brain', id)).toEqual({ ok: true, value: 'binary' })
  })

  it('leaves out a listed path that the contract cannot carry', async () => {
    const index = await createFiles(storeOf(new Uint8Array())).index('brain')
    expect(index.ok && index.value !== 'notFound' && index.value.files.map((f) => f.path)).toEqual(['notes/a.md'])
  })
})
