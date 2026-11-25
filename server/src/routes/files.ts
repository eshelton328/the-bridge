// /api/files: the files a chat message can link to. A URL names a file by
// its `FileId`, never by a path; the query names its root. A file that is
// not in the root's index, is missing or leaves the root gets the same 404.
// File text goes only into the text read's 200 body; a fault logs its root
// and its errno code only, never a path.
import { FileId, FilesQuery, FilesResponse, FileTextResponse } from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { FileStoreError } from '../services/fileStore.ts'
import type { Files } from '../services/files.ts'
import { queryOf } from './jsonBody.ts'

export function filesRoutes(files: Files, log: Logger) {
  const failed = (c: Context<AppEnv>, root: string, error: FileStoreError) => {
    log.error('files read failed', { requestId: c.get('requestId'), root, code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  const notFound = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no file has this ID' })
  return new Hono<AppEnv>()
    .get('/', queryOf(FilesQuery), async (c) => {
      const { root } = c.req.valid('query')
      const index = await files.index(root)
      if (!index.ok) return failed(c, root, index.error)
      if (index.value === 'notFound') return notFound(c)
      return c.json(FilesResponse.parse(index.value), 200)
    })
    .get('/:file/text', queryOf(FilesQuery), async (c) => {
      const { root } = c.req.valid('query')
      const id = FileId.safeParse(c.req.param('file'))
      if (!id.success) return notFound(c)
      const read = await files.text(root, id.data)
      if (!read.ok) return failed(c, root, read.error)
      switch (read.value) {
        case 'notFound':
          return notFound(c)
        case 'tooLarge':
          return errorJson(c, 'too-large', { message: 'the file is larger than a text read takes' })
        case 'binary':
          return errorJson(c, 'unsupported-media', { message: 'the file is not text' })
        default:
          return c.json(FileTextResponse.parse(read.value), 200)
      }
    })
}
