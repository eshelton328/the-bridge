// A local copy of the contract that backend-coord's clear-input PR adds to
// @bridge/contract (R28 part B; that PR was not open on 2026-11-20): `POST
// /api/chats/:chat/input/clear` with the body `ClearInputRequest` (an empty
// strict object), which answers 204 once the chat's terminal input is empty,
// and two new `chat-not-ready` states: `noCommands` (a Codex chat, for a
// clear) and `notSubmitted` (a prompt that Claude Code did not take, which
// the server removed again). When that PR merges, import `ClearInputRequest`
// and `ErrorBody` from '@bridge/contract' in place of this file and delete
// it: the names and shapes are the same.
import { ErrorBody as ContractErrorBody } from '@bridge/contract'
import { z } from 'zod'

/** The body of `POST /api/chats/:chat/input/clear`: an empty JSON object. */
export const ClearInputRequest = z.strictObject({})
export type ClearInputRequest = z.infer<typeof ClearInputRequest>

/** The contract's error body, with the two `chat-not-ready` states the clear-input PR adds. */
export const ErrorBody = z.union([
  ContractErrorBody,
  z.object({
    error: z.object({
      kind: z.literal('chat-not-ready'),
      state: z.enum(['noCommands', 'notSubmitted']),
      message: z.string(),
      requestId: z.string(),
    }),
  }),
])
export type ErrorBody = z.infer<typeof ErrorBody>
