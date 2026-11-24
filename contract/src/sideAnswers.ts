// A side question about a Claude chat: a copy of the chat's session answers it, and the chat never sees the
// question or the answer. `POST /api/chats/:chat/side` answers 202 with the side ID, `GET
// /api/chats/:chat/side/:side` gives the answer so far, and the page reads it again until its last state.
// The server keeps the last answers in memory only.
import { z } from 'zod'
import { ChatId } from './ids.ts'
import { maxEntryText } from './transcripts.ts'

/** The most characters of a side question, after its ends are trimmed. */
export const maxSideQuestion = 4000

/** A side question: its text only (a strict object), never a session, a model or a flag. */
export const SideQuestionRequest = z.strictObject({ question: z.string().trim().min(1).max(maxSideQuestion) })
export type SideQuestionRequest = z.infer<typeof SideQuestionRequest>

/** A side answer's ID: 16 hex characters that the server makes. */
export const SideId = z
  .string()
  .regex(/^[0-9a-f]{16}$/)
  .brand<'SideId'>()
export type SideId = z.infer<typeof SideId>

/**
 * Where a side answer is: still `answering`, `done`, `failed`, stopped at the server's time limit (`timedOut`), or
 * stopped by the owner (`stopped`).
 */
export const SideState = z.enum(['answering', 'done', 'failed', 'timedOut', 'stopped'])
export type SideState = z.infer<typeof SideState>

/** A side answer: its whole text so far, in Markdown, cut at `maxEntryText` (`cut`), and its state. */
export const SideAnswer = z.object({
  side: SideId,
  chat: ChatId,
  state: SideState,
  text: z.string().max(maxEntryText),
  cut: z.boolean(),
})
export type SideAnswer = z.infer<typeof SideAnswer>

/** The 202 answer of a side question: the ID to read its answer by. */
export const SideStarted = z.object({ side: SideId, chat: ChatId })
export type SideStarted = z.infer<typeof SideStarted>
