// The server's error responses (d-115). Every non-2xx body is an
// ErrorBody from the contract with the request's ID, built with c.json so
// the X-Request-Id header stays on it. The detail behind a client message
// (a socket path, herdr's text) goes to the log only.
import { ErrorBody, type ErrorKind, errorStatus } from '@bridge/contract'
import type { Context } from 'hono'
import type { RequestIdVariables } from 'hono/request-id'
import type { AgentPortError } from './services/agentPort.ts'

/** The context of every route: the request ID middleware runs first (app.ts). */
export type AppEnv = { Variables: RequestIdVariables }

/** The response of one error kind, with its fields, the request's ID and the kind's status. */
export function errorJson<Kind extends ErrorKind['kind']>(
  c: Context<AppEnv>,
  kind: Kind,
  fields: Omit<Extract<ErrorKind, { kind: Kind }>, 'kind' | 'requestId'>,
) {
  const body = ErrorBody.parse({ error: { ...fields, kind, requestId: c.get('requestId') } })
  const status: (typeof errorStatus)[Kind] = errorStatus[kind]
  return c.json(body, status)
}

/** herdr did not answer (503) or answered with something the server does not read (502). */
export function agentErrorJson(c: Context<AppEnv>, error: AgentPortError) {
  switch (error.reason) {
    case 'unreachable':
      return errorJson(c, 'herdr-unavailable', { message: 'herdr does not answer' })
    case 'badReply':
      return errorJson(c, 'herdr-bad-reply', { message: 'herdr answered with something the server does not read' })
  }
}

/** The kinds that need no field besides the message, so a thrown AppError can carry one. */
export type PlainErrorKind = Exclude<ErrorKind['kind'], 'not-found' | 'invalid-input'>
const plainKinds: ReadonlySet<string> = new Set<PlainErrorKind>([
  'forbidden',
  'herdr-bad-reply',
  'herdr-unavailable',
  'too-many-requests',
  'internal',
])
export const isPlainErrorKind = (kind: string): kind is PlainErrorKind => plainKinds.has(kind)

/** The SSE `error` event's data for a port error, as the error response would give it. */
export function agentErrorBody(error: AgentPortError, requestId: string): ErrorBody {
  switch (error.reason) {
    case 'unreachable':
      return { error: { kind: 'herdr-unavailable', message: 'herdr does not answer', requestId } }
    case 'badReply':
      return {
        error: {
          kind: 'herdr-bad-reply',
          message: 'herdr answered with something the server does not read',
          requestId,
        },
      }
  }
}

export const internalMessage = 'the server failed; its log has the cause under this request ID'
