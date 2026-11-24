// Side questions about a Claude chat, under /api/chats: `POST /:chat/side` answers 202 with the side ID, `GET
// /:chat/side/:side` gives the answer so far (the page reads it again until its last state), and `POST
// /:chat/side/:side/stop` stops it.
// The question and the answer go only to the port and the page: never into a log line or an ErrorBody.
import {
  ChatId,
  maxSideQuestion,
  SideAnswer,
  SideId,
  SideQuestionRequest,
  SideStarted,
  StopChatRequest,
} from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPortError } from '../services/agentPort.ts'
import type { SideAnswers } from '../services/sideAnswers.ts'
import { jsonBody, jsonLimit, jsonOnly, smallJson } from './jsonBody.ts'

/** The largest side question body: the longest question with each character as a JSON escape, and room for the rest. */
const sideJson = jsonLimit(maxSideQuestion * 6 + 1024)

export function sidesRoutes(sides: SideAnswers, log: Logger) {
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', {
      message: 'the chat or side ID is not valid',
      issues: ['a chat ID is <machine>/<chat>, URL-encoded; a side ID is 16 hex characters'],
    })
  const gone = (c: Context<AppEnv>, what: string) => errorJson(c, 'not-found', { path: c.req.path, message: what })
  const failed = (c: Context<AppEnv>, error: AgentPortError) => {
    log.warn('herdr call failed', { requestId: c.get('requestId'), reason: error.reason, detail: error.message })
    return agentErrorJson(c, error)
  }
  const idsOf = (c: Context<AppEnv>) => {
    const chat = ChatId.safeParse(c.req.param('chat'))
    const side = SideId.safeParse(c.req.param('side'))
    return chat.success && side.success ? { chat: chat.data, side: side.data } : undefined
  }
  return new Hono<AppEnv>()
    .post('/:chat/side', sideJson, jsonOnly, jsonBody(SideQuestionRequest), async (c) => {
      const chat = ChatId.safeParse(c.req.param('chat'))
      if (!chat.success) return invalid(c)
      const asked = await sides.ask(chat.data, c.req.valid('json').question)
      if (!asked.ok) return failed(c, asked.error)
      switch (asked.value) {
        case 'notFound':
          return gone(c, 'no chat has this ID')
        case 'noSession':
          return errorJson(c, 'chat-not-ready', { state: 'noSession', message: 'the chat has no saved Claude session' })
        case 'busy':
          return errorJson(c, 'chat-not-ready', {
            state: 'sideBusy',
            message: 'a side question of this chat, or three in all, is still answering',
          })
      }
      return c.json(SideStarted.parse({ side: asked.value.side, chat: asked.value.chat }), 202)
    })
    .get('/:chat/side/:side', (c) => {
      const ids = idsOf(c)
      if (ids === undefined) return invalid(c)
      const answer = sides.get(ids.chat, ids.side)
      return answer === undefined ? gone(c, 'no side answer has this ID') : c.json(SideAnswer.parse(answer), 200)
    })
    .post('/:chat/side/:side/stop', smallJson, jsonOnly, jsonBody(StopChatRequest), (c) => {
      const ids = idsOf(c)
      if (ids === undefined) return invalid(c)
      // A stop of an answer that ended is 204 too: the page's Stop and the answer's end can cross.
      return sides.stop(ids.chat, ids.side) === 'notFound' ? gone(c, 'no side answer has this ID') : c.body(null, 204)
    })
}
