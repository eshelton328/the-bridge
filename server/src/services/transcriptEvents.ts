// The transcript events of one chat, for GET /api/chats/:chat/transcript/events.
// Each stream watches its chat through the port, and reads the transcript
// once when it opens, after the watch is ready, so a change made while it
// opens is not lost. On each change it reads the transcript again and
// sends the entries that are new or changed since its last read, in
// transcript order, with the IDs of those that are new (`added`). It sends nothing for a read with no change. With no
// stream open for a chat, nothing watches it (d-112). Each stream also
// takes the list's changes: when a read then finds no such chat (after
// /clear the pane has a new session, so a new chat ID), the stream ends
// with `gone`, so the client stops waiting on a chat that has left.
import { type ChatId, EventSource, type TranscriptChangedEvent, type TranscriptEntry } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

export type TranscriptClient = {
  /** Sends one event to the client. */
  readonly send: (event: TranscriptChangedEvent) => void
  /** Ends the client's stream: the agents stopped answering. */
  readonly end: (error: AgentPortError) => void
  /** Ends the client's stream: the machine no longer has the chat. */
  readonly gone: () => void
}

/**
 * Starts the transcript events of `chat` for one client: the result stops them, or is `null` when the machine has
 * no such chat. Nothing is sent to the client before this resolves.
 */
export async function connectTranscript(
  agents: AgentPort,
  chat: ChatId,
  client: TranscriptClient,
): Promise<Result<(() => void) | null, AgentPortError>> {
  const source = EventSource.parse(`${agents.machine}/transcript`)
  const known = new Map<string, string>()
  let seq = 0
  let over = false
  let reading = false
  let again = false
  // Read through functions: a callback can change them while a read is awaited.
  const isOver = () => over
  const isAgain = () => again

  const remember = (entries: readonly TranscriptEntry[]) => {
    for (const entry of entries) known.set(entry.id, JSON.stringify(entry))
  }

  // Resolves when the stream ends, so a start that waits for a watch or a subscription that ended stops waiting.
  let endWait: () => void = () => undefined
  const endedEarly = new Promise<void>((resolve) => {
    endWait = resolve
  })

  const stop = () => {
    over = true
    watch.close()
    list.close()
    endWait()
  }

  const refresh = async (): Promise<void> => {
    if (reading) {
      again = true
      return
    }
    reading = true
    const read = await agents.readTranscript(chat)
    reading = false
    if (over) return
    if (!read.ok) {
      stop()
      client.end(read.error)
      return
    }
    if (read.value === null) {
      stop()
      client.gone()
      return
    }
    const entries = read.value.entries
    const changed = entries.filter((e) => known.get(e.id) !== JSON.stringify(e))
    const added = changed.filter((e) => !known.has(e.id)).map((e) => e.id)
    remember(changed)
    if (changed.length > 0)
      client.send({ source, seq: seq++, type: 'transcript.changed', data: { chat, entries: changed, added } })
    if (again) {
      again = false
      await refresh()
    }
  }

  const watch = agents.watchTranscript(
    chat,
    () => {
      if (!opening) void refresh()
      else again = true
    },
    (error) => {
      ended(error)
    },
  )
  let endError: AgentPortError | undefined
  const ended = (error: AgentPortError) => {
    if (over) return
    endError = error
    stop()
    client.end(error)
  }
  // A changed list can mean that the chat has left; the read after it tells.
  const list = agents.subscribe((event) => {
    if (event.type !== 'workspacesChanged') return
    if (!opening) void refresh()
    else again = true
  }, ended)
  let opening = true
  await Promise.race([Promise.all([watch.ready, list.ready]), endedEarly])
  // An end before the start finished: the agents' error, which the caller answers before any stream opens.
  if (isOver()) return endError === undefined ? ok(() => undefined) : err(endError)
  const first = await agents.readTranscript(chat)
  opening = false
  if (isOver()) return first.ok ? ok(() => undefined) : first
  if (!first.ok) {
    stop()
    return err(first.error)
  }
  if (first.value === null) {
    stop()
    return ok(null)
  }
  remember(first.value.entries)
  if (isAgain()) {
    again = false
    void refresh()
  }
  return ok(stop)
}
