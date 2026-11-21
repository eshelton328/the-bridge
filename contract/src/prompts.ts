// What the owner sends to a chat: `POST /api/chats/:chat/prompt` with a
// prompt, `POST /api/chats/:chat/stop` to stop the chat's work (slice
// W1), and `POST /api/chats/:chat/input/clear` to empty its input box. Each request acts on one chat, the one in its path. The
// server answers 204 with no body; a chat that cannot take the request
// gets a `chat-not-ready` error (errors.ts). The prompt text goes to the
// chat only, never into a log line or an error body (d-115). A prompt to
// a Claude chat can carry the IDs of complete uploads (slice W1b,
// uploads.ts); the server adds each file's path below the text, and the
// chat reads the file with its own tools. `POST /api/chats/:chat/command`
// sends one Claude Code command to a Claude chat (slice W5): `/compact`,
// with the owner's instructions if any, or `/clear`.
import { z } from 'zod'
import { SendId, UploadId } from './ids.ts'

/** The most characters in one prompt. */
export const maxPromptChars = 32_768

/** The most files on one prompt. */
export const maxAttachments = 10

/**
 * The body of `POST /api/chats/:chat/prompt`: the text, as the owner wrote it, and the complete uploads to attach.
 * The text may be empty only when the prompt has a file. An attachment that is not a complete upload of this chat
 * is 409 `upload-conflict`; one to a Codex chat is 409 `chat-not-ready` `noAttachments`.
 */
export const SendPromptRequest = z
  .strictObject({
    text: z.string().max(maxPromptChars),
    attachments: z.array(UploadId).max(maxAttachments).optional(),
    /** The page's ID of this send; a second prompt with the same ID to the same chat sends nothing (409 `duplicateSend`). */
    sendId: SendId.optional(),
  })
  .refine((body) => body.text.trim() !== '' || (body.attachments?.length ?? 0) > 0, {
    message: 'the prompt has no text and no file',
    path: ['text'],
  })
export type SendPromptRequest = z.infer<typeof SendPromptRequest>

/**
 * What became of a send, from `GET /api/chats/:chat/sends/:send`: `pending` while the server sends it, `sent`,
 * `notSubmitted` (the chat did not take it and the server removed the text), `notSent` (refused before any text was
 * typed, such as a chat that waits for the owner), or `unknown` (the chat may hold the text: a herdr failure, text
 * that stayed in the box, or a screen with no box). The
 * server keeps each result for `sendResultMs`, in memory and with no text; then, or after a restart, the read is 404.
 */
export const SendResult = z.enum(['pending', 'sent', 'notSubmitted', 'notSent', 'unknown'])
export type SendResult = z.infer<typeof SendResult>
export const SendResultResponse = z.strictObject({ result: SendResult })
export type SendResultResponse = z.infer<typeof SendResultResponse>

/** How long the server keeps the result of a send. */
export const sendResultMs = 10 * 60_000

/** The body of a stop: an empty JSON object, so a stop is JSON as a prompt is. */
export const StopChatRequest = z.strictObject({})
export type StopChatRequest = z.infer<typeof StopChatRequest>

/**
 * The body of `POST /api/chats/:chat/input/clear`, which empties the input box of a Claude chat's terminal (204),
 * for text that another client typed there and did not send: an empty JSON object. The text it removes is lost,
 * so the page asks the owner first; the server never returns or logs that text.
 */
export const ClearInputRequest = z.strictObject({})
export type ClearInputRequest = z.infer<typeof ClearInputRequest>

/** The most characters in the instructions of a `/compact`. */
export const maxCompactChars = 1000

/**
 * The body of `POST /api/chats/:chat/command`: `compact` summarises the chat's context, with the owner's
 * instructions for the summary if any (one line); `clear` starts the chat over in a new session, so its context is
 * lost and the chat gets a new chat ID on the same pane, and the page asks the owner first. A chat that works is 409
 * `chat-not-ready` `working`, a Codex chat `noCommands`. The instructions go to the chat only, never into a log
 * line or an error body, as a prompt's text.
 */
export const ChatCommandRequest = z.discriminatedUnion('command', [
  z.strictObject({
    command: z.literal('compact'),
    instructions: z
      .string()
      .max(maxCompactChars)
      .regex(/^[^\r\n]*$/, 'the instructions are one line')
      .optional(),
  }),
  z.strictObject({ command: z.literal('clear') }),
])
export type ChatCommandRequest = z.infer<typeof ChatCommandRequest>
