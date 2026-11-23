// A side question about a Claude chat: a copy of the chat's session answers it, and the chat never sees the
// question or the answer. `POST /api/chats/:chat/side` answers 202 with the side ID, `GET
// /api/chats/:chat/side/:side` gives the answer so far, and `GET /api/chats/:chat/side/:side/events` streams it.
// The server keeps the last answers in memory only.
import { z } from 'zod'
import { eventOf } from './events.ts'
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

/** Where a side answer is: still `answering`, `done`, `failed`, or stopped at the server's time limit (`timedOut`). */
export const SideState = z.enum(['answering', 'done', 'failed', 'timedOut'])
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

/** The 202 answer of a side question: the ID to read and stream its answer by. */
export const SideStarted = z.object({ side: SideId, chat: ChatId })
export type SideStarted = z.infer<typeof SideStarted>

/** The side answer as it is now: the stream sends it when it opens and at each change, and ends after its last state. */
export const SideChangedEvent = eventOf('side.changed', SideAnswer)
export type SideChangedEvent = z.infer<typeof SideChangedEvent>
