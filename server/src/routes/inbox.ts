// /api/inbox (R20, f-003): what waits on the owner. A URL names an item by
// its `InboxId`, never by a path. A brain record's text goes only into the
// detail's 200 body; a fault logs its errno code only, never a title.
import { InboxActionRequest, InboxDetailResponse, InboxId, InboxResponse, SnoozeInboxRequest } from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPortError } from '../services/agentPort.ts'
import type { Inbox } from '../services/inbox.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

type Fault = AgentPortError | { readonly reason: 'failed'; readonly code: string }

export function inboxRoutes(inbox: Inbox, log: Logger) {
  const failed = (c: Context<AppEnv>, error: Fault) => {
    if (error.reason !== 'failed') return agentErrorJson(c, error)
    log.error('inbox read failed', { requestId: c.get('requestId'), code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  const idOf = (c: Context<AppEnv>) => InboxId.safeParse(c.req.param('item'))
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', { message: 'the item ID is not valid', issues: ['an item ID is 16 hex characters'] })
  const notFound = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no Inbox item has this ID' })
  const act = async (c: Context<AppEnv>, change: Parameters<Inbox['act']>[1]) => {
    const id = idOf(c)
    if (!id.success) return invalid(c)
    const done = await inbox.act(id.data, change)
    if (!done.ok) return failed(c, done.error)
    switch (done.value) {
      case 'done':
        return c.body(null, 204)
      case 'notFound':
        return notFound(c)
      case 'readOnly':
        return errorJson(c, 'inbox-read-only', { message: 'this item takes no action here' })
    }
  }
  return new Hono<AppEnv>()
    .get('/', async (c) => {
      const listed = await inbox.list()
      if (!listed.ok) return failed(c, listed.error)
      return c.json(InboxResponse.parse(listed.value), 200)
    })
    .get('/:item', async (c) => {
      const id = idOf(c)
      if (!id.success) return invalid(c)
      const found = await inbox.get(id.data)
      if (!found.ok) return failed(c, found.error)
      if (found.value === 'notFound') return notFound(c)
      return c.json(InboxDetailResponse.parse(found.value), 200)
    })
    .post('/:item/snooze', smallJson, jsonOnly, jsonBody(SnoozeInboxRequest), (c) =>
      act(c, { action: 'snooze', until: c.req.valid('json').until }),
    )
    .post('/:item/done', smallJson, jsonOnly, jsonBody(InboxActionRequest), (c) => act(c, { action: 'done' }))
    .post('/:item/dismiss', smallJson, jsonOnly, jsonBody(InboxActionRequest), (c) => act(c, { action: 'dismiss' }))
}
