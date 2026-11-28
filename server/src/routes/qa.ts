// /api/projects/:slug/qa (f-008 increment three): the QA list.
// A slug that the contract does not take, or that names no project, is 404. A Linear
// fault is 503 or 502 and a key file fault 500; its code goes to the log
// only, never a key, a title or comment text.
import { ProjectSlug, QaListResponse } from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { LinearFault, Qa } from '../services/qa.ts'

export function qaRoutes(qa: Qa, log: Logger) {
  const failed = (c: Context<AppEnv>, error: LinearFault) => {
    const fields = { requestId: c.get('requestId'), reason: error.reason, code: error.code }
    switch (error.reason) {
      case 'unavailable':
        log.warn('qa read failed', fields)
        return errorJson(c, 'linear-unavailable', { message: 'Linear does not answer' })
      case 'badReply':
        log.warn('qa read failed', fields)
        return errorJson(c, 'linear-bad-reply', { message: 'Linear answered with something the server does not read' })
      case 'failed':
        log.error('qa read failed', fields)
        return errorJson(c, 'internal', { message: internalMessage })
    }
  }
  const notFound = (c: Context<AppEnv>, message: string) => errorJson(c, 'not-found', { path: c.req.path, message })

  return new Hono<AppEnv>().get('/:slug/qa', async (c) => {
    const slug = ProjectSlug.safeParse(c.req.param('slug'))
    if (!slug.success) return notFound(c, 'no project has this name')
    const listed = await qa.list(slug.data)
    if (!listed.ok) return failed(c, listed.error)
    if (listed.value === 'notFound') return notFound(c, 'no project has this name')
    return c.json(QaListResponse.parse(listed.value), 200)
  })
}
