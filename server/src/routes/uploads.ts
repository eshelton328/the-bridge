// /api/uploads: the chunks of a file that the owner attaches to a prompt
// (slice W1b), after POST /api/chats/:chat/uploads started it. PUT
// /:upload/chunks/:n takes one chunk as raw bytes (application/octet-stream,
// which a cross-site form cannot send) and streams it to the store, so a
// large file never sits in memory. POST /:upload/complete makes it a file,
// (a HEIC photo that does not convert to JPEG is 415), and DELETE
// /:upload removes it. The file name and bytes never go into a
// log line or an ErrorBody (d-115).
import { CompleteUploadRequest, CompleteUploadResponse, UploadId } from '@bridge/contract'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { UploadStore, UploadStoreError } from '../services/uploadStore.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

/** The answer to a store fault: 507 when the disk is full, else 500; the log gets the reason and the errno code. */
export function storeFailed(c: Context<AppEnv>, log: Logger, error: UploadStoreError) {
  log.warn('upload failed', { requestId: c.get('requestId'), reason: error.reason, code: error.code })
  return error.reason === 'full'
    ? errorJson(c, 'storage-full', { message: 'the server has no disk space for the file' })
    : errorJson(c, 'internal', { message: internalMessage })
}

/** The bytes of a request with no body: none. */
const noBytes: AsyncIterable<Uint8Array> = {
  [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true, value: undefined }) }),
}

export function uploadsRoutes(uploads: UploadStore, log: Logger) {
  const uploadOf = (c: Context<AppEnv>) => UploadId.safeParse(c.req.param('upload'))
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', { message: 'the upload ID is not valid', issues: ['upload: invalid_format'] })
  const missed = (c: Context<AppEnv>, outcome: 'notFound' | 'conflict' | 'unsupported') => {
    switch (outcome) {
      case 'notFound':
        return errorJson(c, 'not-found', { path: c.req.path, message: 'no upload has this ID' })
      case 'conflict':
        return errorJson(c, 'upload-conflict', { message: 'the request does not match the upload' })
      case 'unsupported':
        return errorJson(c, 'unsupported-media', { message: 'the server cannot convert this photo to JPEG' })
    }
  }
  return new Hono<AppEnv>()
    .put('/:upload/chunks/:n', async (c) => {
      if (!/^application\/octet-stream(;|$)/i.test(c.req.header('Content-Type') ?? ''))
        return errorJson(c, 'invalid-input', {
          message: 'a chunk must be raw bytes',
          issues: ['Content-Type must be application/octet-stream'],
        })
      const id = uploadOf(c)
      if (!id.success) return invalid(c)
      const n = c.req.param('n')
      if (!/^\d{1,9}$/.test(n))
        return errorJson(c, 'invalid-input', {
          message: 'the chunk number is not valid',
          issues: ['n: invalid_format'],
        })
      const written = await uploads.writeChunk(id.data, Number(n), c.req.raw.body ?? noBytes)
      if (!written.ok) return storeFailed(c, log, written.error)
      return written.value === 'written' ? c.body(null, 204) : missed(c, written.value)
    })
    .post('/:upload/complete', smallJson, jsonOnly, jsonBody(CompleteUploadRequest), async (c) => {
      const id = uploadOf(c)
      if (!id.success) return invalid(c)
      const done = await uploads.complete(id.data)
      if (!done.ok) return storeFailed(c, log, done.error)
      return done.value === 'complete'
        ? c.json(CompleteUploadResponse.parse({ attachment: id.data }), 200)
        : missed(c, done.value)
    })
    .delete('/:upload', async (c) => {
      const id = uploadOf(c)
      if (!id.success) return invalid(c)
      const removed = await uploads.remove(id.data)
      if (!removed.ok) return storeFailed(c, log, removed.error)
      return removed.value === 'removed' ? c.body(null, 204) : missed(c, removed.value)
    })
}
