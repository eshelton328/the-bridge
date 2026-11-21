// The UploadStore: where the files that the owner attaches to a prompt
// wait until a chat reads them (slice W1b). A file goes up in chunks of
// `chunkSize` bytes; chunk n holds bytes n × chunkSize up to the next
// chunk, and only the last is shorter. The store never runs a file and
// never looks at what it holds, and keeps its name only to give the chat
// a file with the same extension. A HEIC photo becomes a JPEG at complete,
// as a chat cannot read HEIC; the original stays beside it. Each start
// first removes the uploads that are past their time: an unfinished one
// after 24 hours, a complete one after 7 days. Its contract suite is adapters/uploadStoreContract.ts.
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
  /**
   * Makes the upload a complete file once each chunk is there (`conflict` before that); again, it changes nothing.
   * A HEIC file that does not convert to JPEG is `unsupported`, and stays not complete.
   */
  complete(upload: UploadId): Promise<Result<UploadOutcome<'complete' | 'unsupported'>, UploadStoreError>>
  /** The path of a complete upload's file, as the chat reads it; null when it is not a complete upload of `chat`. */
  attachment(upload: UploadId, chat: ChatId): Promise<Result<string | null, UploadStoreError>>
  /** Deletes the upload and its file. */
  remove(upload: UploadId): Promise<Result<'removed' | 'notFound', UploadStoreError>>
}

/** The chunk size that the server gives, 8 MiB: a request a proxy passes, and a short retry when one fails. */
export const defaultChunkBytes = 8 * 1024 ** 2

/** How long an unfinished upload stays: 24 hours. */
const unfinishedMs = 24 * 60 * 60 * 1000

/** How long a complete upload stays, so a chat can read it again later: 7 days. */
const keptMs = 7 * 24 * 60 * 60 * 1000

/** Whether an upload started at `startedAt` and complete at `completedAt` (null: not complete) is past its time. */
export const expired = (startedAt: number, completedAt: number | null, now: number): boolean =>
  completedAt === null ? now - startedAt >= unfinishedMs : now - completedAt >= keptMs

/** How many chunks a file of `size` bytes has. */
export const chunkCount = (size: number, chunkSize: number): number => Math.ceil(size / chunkSize)

/** The length in bytes of chunk `n` of a file of `size` bytes; null for a number outside the file. */
export function chunkLength(size: number, chunkSize: number, n: number): number | null {
  const count = chunkCount(size, chunkSize)
  if (!Number.isInteger(n) || n < 0 || n >= count) return null
  return n === count - 1 ? size - n * chunkSize : chunkSize
}
