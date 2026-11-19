// The envelope of every server-sent event (d-111, d-112). Each source, such
// as one machine's herdr adapter, numbers its own events from 0, so a client
// that reconnects with Last-Event-ID gets only the events after it.
import { z } from 'zod'

/** Where an event comes from: "<machine>/<part>", such as "mac-mini/herdr". */
export const EventSource = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .brand<'EventSource'>()
export type EventSource = z.infer<typeof EventSource>

/** An event with any data: its source, its sequence number in that source, its type and its data. */
export const EventEnvelope = z.object({
  source: EventSource,
  seq: z.number().int().min(0),
  type: z.string().min(1),
  data: z.unknown(),
})
export type EventEnvelope = z.infer<typeof EventEnvelope>

/** The envelope of one event type, with the schema of its data. */
export function eventOf<Type extends string, Data extends z.ZodType>(type: Type, data: Data) {
  return EventEnvelope.extend({ type: z.literal(type), data })
}
