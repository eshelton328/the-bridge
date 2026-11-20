// Files that the owner attaches to a prompt (slice W1b). A file of any
// type goes up in chunks, so a large one never sits in memory and a chunk
// that fails is sent again:
//   POST /api/chats/:chat/uploads   StartUploadRequest → 201 StartUploadResponse
//   PUT  /api/uploads/:upload/chunks/:n   raw bytes (application/octet-stream) → 204
//   POST /api/uploads/:upload/complete   {} → 200 CompleteUploadResponse
//   DELETE /api/uploads/:upload → 204
// Chunk n (from 0) holds bytes n × chunkSize up to the next chunk; only the
// last is shorter, and the same n again replaces it. The server stores the
// file and never opens or runs it; the chat reads it with its own tools. The
// file name and content never go into a log line or an error body.
import { z } from 'zod'
import { UploadId } from './ids.ts'

/** The largest file, 1 GiB; a larger `size` is 413 `too-large`. */
export const maxUploadBytes = 1024 ** 3

/** The body of `POST /api/chats/:chat/uploads`: the file's name, its size in bytes and the browser's MIME type. */
export const StartUploadRequest = z.strictObject({
  name: z.string().min(1).max(255),
  size: z.number().int().min(1),
  type: z.string().max(255),
})
export type StartUploadRequest = z.infer<typeof StartUploadRequest>

/** The upload's ID and the size of each chunk but the last, in bytes. */
export const StartUploadResponse = z.object({ upload: UploadId, chunkSize: z.number().int().min(1) })
export type StartUploadResponse = z.infer<typeof StartUploadResponse>

/** The body of `POST /api/uploads/:upload/complete`: an empty JSON object. */
export const CompleteUploadRequest = z.strictObject({})
export type CompleteUploadRequest = z.infer<typeof CompleteUploadRequest>

/** The attachment that a prompt names: the upload's ID, now a complete file. */
export const CompleteUploadResponse = z.object({ attachment: UploadId })
export type CompleteUploadResponse = z.infer<typeof CompleteUploadResponse>
