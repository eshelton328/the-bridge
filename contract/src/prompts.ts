// What the owner sends to a chat: `POST /api/chats/:chat/prompt` with a
// prompt, `POST /api/chats/:chat/stop` to stop the chat's work (slice
// W1), and `POST /api/chats/:chat/input/clear` to empty its input box. Each request acts on one chat, the one in its path. The
// server answers 204 with no body; a chat that cannot take the request
// gets a `chat-not-ready` error (errors.ts). The prompt text goes to the
// chat only, never into a log line or an error body (d-115). A prompt to
// a Claude chat can carry the IDs of complete uploads (slice W1b,
// uploads.ts); the server adds each file's path below the text, and the
// chat reads the file with its own tools.
import { z } from 'zod'
import { UploadId } from './ids.ts'

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
  })
  .refine((body) => body.text.trim() !== '' || (body.attachments?.length ?? 0) > 0, {
    message: 'the prompt has no text and no file',
    path: ['text'],
  })
export type SendPromptRequest = z.infer<typeof SendPromptRequest>

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
