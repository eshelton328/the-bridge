// What the owner sends to a chat: `POST /api/chats/:chat/prompt` with a
// prompt, and `POST /api/chats/:chat/stop` to stop the chat's work
// (slice W1). Each request acts on one chat, the one in its path. The
// server answers 204 with no body; a chat that cannot take the request
// gets a `chat-not-ready` error (errors.ts). The prompt text goes to the
// chat only, never into a log line or an error body (d-115).
import { z } from 'zod'

/** The most characters in one prompt. */
export const maxPromptChars = 32_768

/** The body of `POST /api/chats/:chat/prompt`: the text, as the owner wrote it, with something in it. */
export const SendPromptRequest = z.strictObject({
  text: z
    .string()
    .max(maxPromptChars)
    .refine((text) => text.trim() !== '', 'the prompt has no text'),
})
export type SendPromptRequest = z.infer<typeof SendPromptRequest>

/** The body of a stop: an empty JSON object, so a stop is JSON as a prompt is. */
export const StopChatRequest = z.strictObject({})
export type StopChatRequest = z.infer<typeof StopChatRequest>
