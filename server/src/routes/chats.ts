// /api/chats: the chats sub-app. GET /:chat/transcript returns the last
// entries of one chat's transcript, with its ID URL-encoded, checked
// against the contract. It reads only that chat's session. Transcript
// text goes only into the 200 body, never into a log line or an
// ErrorBody (d-115).
import { ChatId, TranscriptResponse } from '@bridge/contract'
import { Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort } from '../services/agentPort.ts'
import { readTranscript } from '../services/chats.ts'

export function chatsRoutes(agents: AgentPort, log: Logger) {
  return new Hono<AppEnv>().get('/:chat/transcript', async (c) => {
    const id = ChatId.safeParse(c.req.param('chat'))
    if (!id.success)
      return errorJson(c, 'invalid-input', {
        message: 'the chat ID is not valid',
        issues: ['a chat ID is <machine>/<chat>, URL-encoded'],
      })
    const read = await readTranscript(agents, id.data)
    if (!read.ok) {
      log.warn('herdr call failed', {
        requestId: c.get('requestId'),
        reason: read.error.reason,
        detail: read.error.message,
      })
      return agentErrorJson(c, read.error)
    }
    if (read.value === null) return errorJson(c, 'not-found', { path: c.req.path, message: 'no chat has this ID' })
    return c.json(TranscriptResponse.parse(read.value), 200)
  })
}
