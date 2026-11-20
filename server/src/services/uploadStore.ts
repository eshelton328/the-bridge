// The UploadStore: where the files that the owner attaches to a prompt
// wait until a chat reads them (slice W1b). A file goes up in chunks of
// `chunkSize` bytes; chunk n holds bytes n × chunkSize up to the next
// chunk, and only the last is shorter. The store never runs a file and
// never looks at what it holds, and keeps its name only to give the chat
// a file with the same extension. Its contract suite is adapters/uploadStoreContract.ts.
import type { ChatId, UploadId } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/**
 * Why the store could not do its work: the disk is full, or another fault, with its errno code when it has one. It
 * holds no message, which could name the file.
 */
export type UploadStoreError = { readonly reason: 'full' | 'failed'; readonly code: string | undefined }

/** What a chunk, a complete or a remove found: `notFound` for no such upload; `conflict` when the request does not match it. */
type UploadOutcome<Done extends string> = Done | 'notFound' | 'conflict'

export type UploadStore = {
  /** The size in bytes of each chunk but the last. */
  readonly chunkSize: number
  /** Starts an upload of `size` bytes for `chat`, as the file `name`. */
  start(chat: ChatId, name: string, size: number): Promise<Result<UploadId, UploadStoreError>>
  /**
   * Stores chunk `n` from `bytes`, and replaces it if it came before. A chunk number outside the file, a length
   * that is not the chunk's, or an upload that is complete is `conflict`; it stops at the first piece of `bytes`
   * that goes past the chunk's length.
   */
  writeChunk(
    upload: UploadId,
    n: number,
    bytes: AsyncIterable<Uint8Array>,
  ): Promise<Result<UploadOutcome<'written'>, UploadStoreError>>
  /** Makes the upload a complete file once each chunk is there (`conflict` before that); again, it changes nothing. */
  complete(upload: UploadId): Promise<Result<UploadOutcome<'complete'>, UploadStoreError>>
  /** Deletes the upload and its file. */
  remove(upload: UploadId): Promise<Result<'removed' | 'notFound', UploadStoreError>>
}

/** The chunk size that the server gives, 8 MiB: a request a proxy passes, and a short retry when one fails. */
export const defaultChunkBytes = 8 * 1024 ** 2

/** How many chunks a file of `size` bytes has. */
export const chunkCount = (size: number, chunkSize: number): number => Math.ceil(size / chunkSize)

/** The length in bytes of chunk `n` of a file of `size` bytes; null for a number outside the file. */
export function chunkLength(size: number, chunkSize: number, n: number): number | null {
  const count = chunkCount(size, chunkSize)
  if (!Number.isInteger(n) || n < 0 || n >= count) return null
  return n === count - 1 ? size - n * chunkSize : chunkSize
}

/** A file name with no folder and only letters, digits and . _ -, at most 100 characters with its extension. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).at(-1) ?? ''
  const safe = base
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._]+/, '')
    .slice(-100)
  return safe === '' ? 'file' : safe
}
