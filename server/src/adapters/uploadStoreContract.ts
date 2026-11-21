// The one contract suite of the UploadStore (slice W1b). The disk store
// and the fake run it, so the fake cannot drift from what it stands for.
import { ChatId, UploadId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { UploadStore } from '../services/uploadStore.ts'

export type UploadStoreSetup = {
  /** A store whose chunks are 4 bytes. */
  readonly store: UploadStore
  /** The bytes of a complete upload's file and its name; null for one that is not complete. */
  readonly file: (upload: UploadId) => Promise<{ readonly name: string; readonly bytes: Uint8Array } | null>
}

export type UploadStoreOptions = {
  /** The store's clock. */
  readonly now: () => number
  /** Whether a HEIC photo converts to JPEG. */
  readonly heicConverts: boolean
}

const chat = ChatId.parse('test-mac/chat-a')
const otherChat = ChatId.parse('test-mac/chat-b')
const hour = 60 * 60 * 1000
const none = UploadId.parse('AAAAAAAAAAAAAAAAAAAAAA')
const text = (value: string) => new TextEncoder().encode(value)
async function* bytesOf(...pieces: string[]): AsyncIterable<Uint8Array> {
  for (const piece of pieces) yield await Promise.resolve(text(piece))
}
const started = async (store: UploadStore, name: string, size: number) => {
  const upload = await store.start(chat, name, size)
  if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
  return upload.value
}

/** Starts, fills and completes a file of `content`. */
const stored = async (store: UploadStore, name: string, content: string) => {
  const upload = await started(store, name, content.length)
  for (let n = 0; n * 4 < content.length; n++)
    await store.writeChunk(upload, n, bytesOf(content.slice(n * 4, n * 4 + 4)))
  return upload
}

export function describeUploadStore(
  name: string,
  makeSetup: (options: UploadStoreOptions) => Promise<UploadStoreSetup>,
): void {
  let time = 1_000_000
  const setup = (heicConverts = true) => makeSetup({ now: () => time, heicConverts })
  describe(`UploadStore contract: ${name}`, () => {
    it('stores a file sent in chunks in any order, in pieces of any length, and completes it', async () => {
      const { store, file } = await setup()
      expect(store.chunkSize).toBe(4)
      const upload = await started(store, 'notes.txt', 10)
      expect(await store.writeChunk(upload, 2, bytesOf('ij'))).toEqual({ ok: true, value: 'written' })
      expect(await store.writeChunk(upload, 0, bytesOf('a', 'bcd'))).toEqual({ ok: true, value: 'written' })
      expect(await file(upload)).toBeNull()
      expect(await store.writeChunk(upload, 1, bytesOf('efgh'))).toEqual({ ok: true, value: 'written' })
      expect(await store.complete(upload)).toEqual({ ok: true, value: 'complete' })
      expect(await store.complete(upload)).toEqual({ ok: true, value: 'complete' })
      const done = await file(upload)
      expect(done?.name).toBe('notes.txt')
      expect(new TextDecoder().decode(done?.bytes)).toBe('abcdefghij')
    })

    it('takes a chunk again in place of the one before it', async () => {
      const { store, file } = await setup()
      const upload = await started(store, 'a.bin', 4)
      await store.writeChunk(upload, 0, bytesOf('xxxx'))
      await store.writeChunk(upload, 0, bytesOf('abcd'))
      await store.complete(upload)
      expect(new TextDecoder().decode((await file(upload))?.bytes)).toBe('abcd')
    })

    it('keeps a chunk that came when a retry of it is short or long', async () => {
      const { store, file } = await setup()
      const upload = await started(store, 'a.bin', 8)
      await store.writeChunk(upload, 0, bytesOf('abcd'))
      await store.writeChunk(upload, 1, bytesOf('efgh'))
      expect(await store.writeChunk(upload, 0, bytesOf('xy'))).toEqual({ ok: true, value: 'conflict' })
      expect(await store.writeChunk(upload, 1, bytesOf('wxyz', 'v'))).toEqual({ ok: true, value: 'conflict' })
      expect(await store.complete(upload)).toEqual({ ok: true, value: 'complete' })
      expect(new TextDecoder().decode((await file(upload))?.bytes)).toBe('abcdefgh')
    })

    it('refuses a chunk outside the file, of the wrong length, or after complete, and a complete with a chunk missing', async () => {
      const { store } = await setup()
      const upload = await started(store, 'a.bin', 6)
      const conflict = { ok: true, value: 'conflict' }
      expect(await store.writeChunk(upload, 2, bytesOf('ab'))).toEqual(conflict)
      expect(await store.writeChunk(upload, -1, bytesOf('abcd'))).toEqual(conflict)
      expect(await store.writeChunk(upload, 0.5, bytesOf('abcd'))).toEqual(conflict)
      expect(await store.writeChunk(upload, 0, bytesOf('abc'))).toEqual(conflict)
      expect(await store.writeChunk(upload, 0, bytesOf('abcd', 'e'))).toEqual(conflict)
      expect(await store.writeChunk(upload, 1, bytesOf('efg'))).toEqual(conflict)
      expect(await store.complete(upload)).toEqual(conflict)
      await store.writeChunk(upload, 0, bytesOf('abcd'))
      expect(await store.complete(upload)).toEqual(conflict)
      await store.writeChunk(upload, 1, bytesOf('ef'))
      expect(await store.complete(upload)).toEqual({ ok: true, value: 'complete' })
      expect(await store.writeChunk(upload, 1, bytesOf('ef'))).toEqual(conflict)
    })

    it('gives notFound for an upload it does not have, and after a remove', async () => {
      const { store } = await setup()
      const notFound = { ok: true, value: 'notFound' }
      expect(await store.writeChunk(none, 0, bytesOf('abcd'))).toEqual(notFound)
      expect(await store.complete(none)).toEqual(notFound)
      expect(await store.remove(none)).toEqual(notFound)
      const upload = await started(store, 'a.bin', 2)
      expect(await store.remove(upload)).toEqual({ ok: true, value: 'removed' })
      expect(await store.writeChunk(upload, 0, bytesOf('ab'))).toEqual(notFound)
    })

    it('keeps only a safe name, with its extension', async () => {
      const { store, file } = await setup()
      const upload = await started(store, '../../Photo 1 (copy).PNG', 1)
      await store.writeChunk(upload, 0, bytesOf('x'))
      await store.complete(upload)
      expect((await file(upload))?.name).toBe('Photo_1_copy_.PNG')
    })

    it('gives the path of a complete file only to its own chat', async () => {
      const { store } = await setup()
      const upload = await stored(store, 'a.txt', 'abc')
      expect(await store.attachment(upload, chat)).toEqual({ ok: true, value: null })
      await store.complete(upload)
      const path = await store.attachment(upload, chat)
      expect(path.ok && path.value?.endsWith('/a.txt')).toBe(true)
      expect(await store.attachment(upload, otherChat)).toEqual({ ok: true, value: null })
      expect(await store.attachment(none, chat)).toEqual({ ok: true, value: null })
    })

    it('gives a HEIC photo as its JPEG copy, and one that does not convert is unsupported', async () => {
      const { store, file } = await setup()
      const upload = await stored(store, 'IMG_1.HEIC', 'heic')
      expect(await store.complete(upload)).toEqual({ ok: true, value: 'complete' })
      expect((await file(upload))?.name).toBe('IMG_1.jpg')
      const path = await store.attachment(upload, chat)
      expect(path.ok && path.value?.endsWith('/IMG_1.jpg')).toBe(true)
      const failing = await setup(false)
      const bad = await stored(failing.store, 'IMG_2.heic', 'heic')
      expect(await failing.store.complete(bad)).toEqual({ ok: true, value: 'unsupported' })
      expect(await failing.store.attachment(bad, chat)).toEqual({ ok: true, value: null })
    })

    it('removes an unfinished upload after 24 hours and a complete one after 7 days, at the next start', async () => {
      const { store } = await setup()
      const unfinished = await started(store, 'a.bin', 8)
      const complete = await stored(store, 'b.txt', 'b')
      await store.complete(complete)
      time += 24 * hour
      await started(store, 'c.bin', 1)
      expect(await store.writeChunk(unfinished, 0, bytesOf('abcd'))).toEqual({ ok: true, value: 'notFound' })
      expect((await store.attachment(complete, chat)).ok).toBe(true)
      expect(await store.attachment(complete, chat)).not.toEqual({ ok: true, value: null })
      time += 6 * 24 * hour
      await started(store, 'd.bin', 1)
      expect(await store.attachment(complete, chat)).toEqual({ ok: true, value: null })
    })
  })
}
