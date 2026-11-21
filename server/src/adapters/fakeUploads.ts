// The upload store in memory, for tests and the page's server fake. It
// checks each request as the disk store does (uploadStoreContract.ts). It
// "converts" a HEIC photo by its name only: the bytes stay as they are.
import { randomBytes } from 'node:crypto'
import type { ChatId, UploadId } from '@bridge/contract'
import { UploadId as UploadIdSchema } from '@bridge/contract'
import { ok } from '@bridge/shared'
import {
  chunkCount,
  chunkLength,
  defaultChunkBytes,
  expired,
  isHeic,
  jpegName,
  safeFileName,
  type UploadStore,
} from '../services/uploadStore.ts'

type Upload = {
  chat: ChatId
  name: string
  size: number
  chunks: Map<number, Uint8Array>
  startedAt: number
  completedAt: number | null
}

export type FakeUploadsOptions = {
  readonly chunkSize?: number
  readonly now?: () => number
  /** Whether a HEIC photo converts; true when not set. */
  readonly heicConverts?: boolean
}

export type FakeUploads = UploadStore & {
  /** The bytes and the name of a complete upload's file, as the chat reads it; null for one that is not complete. */
  readonly file: (upload: UploadId) => { readonly name: string; readonly bytes: Uint8Array } | null
}

export function createFakeUploads({
  chunkSize = defaultChunkBytes,
  now = Date.now,
  heicConverts = true,
}: FakeUploadsOptions = {}): FakeUploads {
  const uploads = new Map<UploadId, Upload>()
  const fileName = (found: Upload) => (isHeic(found.name) ? jpegName(found.name) : found.name)
  return {
    chunkSize,
    start(chat, name, size) {
      for (const [id, found] of uploads) if (expired(found.startedAt, found.completedAt, now())) uploads.delete(id)
      const id = UploadIdSchema.parse(randomBytes(16).toString('base64url'))
      uploads.set(id, { chat, name: safeFileName(name), size, chunks: new Map(), startedAt: now(), completedAt: null })
      return Promise.resolve(ok(id))
    },
    async writeChunk(upload, n, bytes) {
      const found = uploads.get(upload)
      if (found === undefined) return ok('notFound')
      const length = chunkLength(found.size, chunkSize, n)
      if (found.completedAt !== null || length === null) return ok('conflict')
      const pieces: Uint8Array[] = []
      let read = 0
      for await (const piece of bytes) {
        read += piece.length
        if (read > length) return ok('conflict')
        pieces.push(piece)
      }
      if (read !== length) return ok('conflict')
      found.chunks.set(n, Buffer.concat(pieces))
      return ok('written')
    },
    complete(upload) {
      const found = uploads.get(upload)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.completedAt !== null) return Promise.resolve(ok('complete'))
      if (found.chunks.size !== chunkCount(found.size, chunkSize)) return Promise.resolve(ok('conflict'))
      if (isHeic(found.name) && !heicConverts) return Promise.resolve(ok('unsupported'))
      found.completedAt = now()
      return Promise.resolve(ok('complete'))
    },
    attachment(upload, chat) {
      const found = uploads.get(upload)
      const usable = found !== undefined && found.completedAt !== null && found.chat === chat
      return Promise.resolve(
        ok(usable ? `/home/dev/.local/share/the-bridge/uploads/${upload}/${fileName(found)}` : null),
      )
    },
    remove(upload) {
      return Promise.resolve(ok(uploads.delete(upload) ? 'removed' : 'notFound'))
    },
    file(upload) {
      const found = uploads.get(upload)
      if (found === undefined || found.completedAt === null) return null
      const ordered = [...found.chunks.entries()].sort(([a], [b]) => a - b).map(([, bytes]) => bytes)
      return { name: fileName(found), bytes: Buffer.concat(ordered) }
    },
  }
}
