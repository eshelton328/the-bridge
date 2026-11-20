// A local mirror of what backend PR W1-2 adds to @bridge/contract for a
// chat's Send and Stop (`POST /api/chats/:chat/prompt` and `.../stop`, each
// answering 204 with no body). Until W1-2 merges, the web app and its fake
// server read these names from here; once it merges, each import of this file
// becomes an import of @bridge/contract and this file goes. It mirrors the
// contract, so change nothing here that W1-2 does not say.
import { ErrorKind } from '@bridge/contract'
import { z } from 'zod'

/** The most characters a prompt may have (W1-2). */
export const maxPromptChars = 32768

/** The body of `POST /api/chats/:chat/prompt`: 1 to `maxPromptChars` characters, not only spaces. */
export const SendPromptRequest = z.strictObject({
  text: z
    .string()
    .min(1)
    .max(maxPromptChars)
    .refine((text) => /\S/.test(text), { message: 'The prompt has only spaces.' }),
})
export type SendPromptRequest = z.infer<typeof SendPromptRequest>

/** The body of `POST /api/chats/:chat/stop`: an empty object. */
export const StopChatRequest = z.strictObject({})

/** The chat cannot take the prompt or the stop now (409): a shell, a chat that waits for the owner, or one not working. */
const ChatNotReady = z.object({
  kind: z.literal('chat-not-ready'),
  state: z.enum(['shell', 'needsYou', 'notWorking']),
  message: z.string(),
  requestId: z.string(),
})

/** `ErrorKind` with W1-2's `chat-not-ready`. */
export const PromptErrorKind = z.union([ErrorKind, ChatNotReady])
export type PromptErrorKind = z.infer<typeof PromptErrorKind>

/** `ErrorBody` with W1-2's `chat-not-ready`. */
export const PromptErrorBody = z.object({ error: PromptErrorKind })
export type PromptErrorBody = z.infer<typeof PromptErrorBody>
