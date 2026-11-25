import { maxIndexFiles } from '@bridge/contract'
import { ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import type { FileStore } from './fileStore.ts'
import { createFiles, fileIdOf, imageTypeOf } from './files.ts'

// A store of one file with the given bytes, to test the text read's checks on bytes that the fake's text cannot hold.
const storeOf = (bytes: Uint8Array): FileStore => ({
  list: () => Promise.resolve(ok(['notes/a.md', '../out.md', '/abs.md'])),
  read: () => Promise.resolve(ok(bytes)),
  locate: () => Promise.resolve(ok('notFound')),
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

  it('reads no file past the index cut', async () => {
    const paths = Array.from({ length: maxIndexFiles + 1 }, (_, i) => `notes/${String(i)}.md`)
    const files = createFiles({
      list: () => Promise.resolve(ok(paths)),
      read: () => Promise.resolve(ok(new Uint8Array())),
      locate: () => Promise.resolve(ok('notFound')),
    })
    expect(await files.text('brain', fileIdOf('brain', `notes/${String(maxIndexFiles)}.md`))).toEqual({
      ok: true,
      value: 'notFound',
    })
  })

  it('leaves out a listed path that the contract cannot carry', async () => {
    const index = await createFiles(storeOf(new Uint8Array())).index('brain')
    expect(index.ok && index.value !== 'notFound' && index.value.files.map((f) => f.path)).toEqual(['notes/a.md'])
  })
})

describe('imageTypeOf', () => {
  const bytes = (...parts: (string | number[])[]) =>
    new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? Array.from(new TextEncoder().encode(p)) : p)))
  it.each([
    ['image/png', bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a])],
    ['image/jpeg', bytes([0xff, 0xd8, 0xff, 0xe0])],
    ['image/gif', bytes('GIF89a')],
    ['image/webp', bytes('RIFF', [0, 0, 0, 0], 'WEBP')],
  ])('finds %s by its first bytes', (type, head) => {
    expect(imageTypeOf(head)).toBe(type)
  })

  it.each([
    ['SVG', bytes('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ['a RIFF that is not WebP', bytes('RIFF', [0, 0, 0, 0], 'WAVE')],
    ['no bytes', bytes()],
  ])('finds no image type in %s', (_, head) => {
    expect(imageTypeOf(head)).toBeUndefined()
  })
})

describe('the image read', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const imageStore = (paths: string[], bytes: Uint8Array): FileStore => ({
    list: () => Promise.resolve(ok(paths)),
    read: () => Promise.resolve(ok(bytes)),
    locate: () => Promise.resolve(ok('notFound')),
  })
  const image = (paths: string[], path: string, bytes = png) =>
    createFiles(imageStore(paths, bytes)).image({ root: 'brain', path })

  it('sends a PNG whose extension and first bytes agree', async () => {
    expect(await image(['a.png'], 'a.png')).toEqual({ ok: true, value: { bytes: png, type: 'image/png' } })
  })

  it.each([
    ['PNG bytes with no image extension', 'a.md'],
    ['PNG bytes with a JPEG extension', 'a.jpg'],
  ])('calls %s unsupported', async (_, path) => {
    expect(await image([path], path)).toEqual({ ok: true, value: 'unsupported' })
  })

  it('calls a file with no image extension unsupported before it reads the file', async () => {
    let reads = 0
    const store: FileStore = {
      list: () => Promise.resolve(ok(['notes/big.md'])),
      read: () => {
        reads += 1
        return Promise.resolve(ok(png))
      },
      locate: () => Promise.resolve(ok('notFound')),
    }
    expect(await createFiles(store).image({ root: 'brain', path: 'notes/big.md' })).toEqual({
      ok: true,
      value: 'unsupported',
    })
    expect(reads).toBe(0)
  })

  it('reads no image past the index cut', async () => {
    const paths = Array.from({ length: maxIndexFiles + 1 }, (_, i) => `img/${String(i)}.png`)
    expect(await image(paths, `img/${String(maxIndexFiles)}.png`)).toEqual({ ok: true, value: 'notFound' })
  })
})
