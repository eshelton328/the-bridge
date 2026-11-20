// The upload store in memory, for tests and the page's server fake. It
// checks each request as the disk store does (uploadStoreContract.ts).
import { randomBytes } from 'node:crypto'
import type { ChatId, UploadId } from '@bridge/contract'
import { UploadId as UploadIdSchema } from '@bridge/contract'
import { ok } from '@bridge/shared'
import { chunkCount, chunkLength, defaultChunkBytes, safeFileName, type UploadStore } from '../services/uploadStore.ts'

type Upload = { chat: ChatId; name: string; size: number; chunks: Map<number, Uint8Array>; complete: boolean }

export type FakeUploads = UploadStore & {
  /** The bytes and the safe name of a complete upload; null for one that is not complete. */
  readonly file: (upload: UploadId) => { readonly name: string; readonly bytes: Uint8Array } | null
}

export function createFakeUploads(chunkSize = defaultChunkBytes): FakeUploads {
  const uploads = new Map<UploadId, Upload>()
  return {
    chunkSize,
    start(chat, name, size) {
      const id = UploadIdSchema.parse(randomBytes(16).toString('base64url'))
      uploads.set(id, { chat, name: safeFileName(name), size, chunks: new Map(), complete: false })
      return Promise.resolve(ok(id))
    },
    async writeChunk(upload, n, bytes) {
      const found = uploads.get(upload)
      if (found === undefined) return ok('notFound')
      const length = chunkLength(found.size, chunkSize, n)
      if (found.complete || length === null) return ok('conflict')
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
      if (found.chunks.size !== chunkCount(found.size, chunkSize)) return Promise.resolve(ok('conflict'))
      found.complete = true
      return Promise.resolve(ok('complete'))
    },
    remove(upload) {
      return Promise.resolve(ok(uploads.delete(upload) ? 'removed' : 'notFound'))
    },
    file(upload) {
      const found = uploads.get(upload)
      if (found?.complete !== true) return null
      const ordered = [...found.chunks.entries()].sort(([a], [b]) => a - b).map(([, bytes]) => bytes)
      return { name: found.name, bytes: Buffer.concat(ordered) }
    },
  }
}
