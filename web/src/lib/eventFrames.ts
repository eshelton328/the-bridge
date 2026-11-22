// The frames of a server-sent event stream (`GET /api/events`, d-112), read
// from a fetch body, as EventSource reads them: the Workspaces watcher and
// transcript streams and the Inbox watcher parse their streams with it.
//
// Review R43b: a server killed behind a running Vite proxy never ends the
// stream, as the proxy does not pass the close on. The server sends a ping
// comment every 15 s on each stream (backend #424), so a stream that gives
// no byte for `streamIdleMs` is lost: the reader cancels the body (which
// closes the connection) and throws a StreamIdleError, and the caller
// connects again as after a drop. The limit counts bytes, pings too, never
// events: an idle chat sends no event by design.

/** One server-sent event: its name and its data. */
export type Frame = { readonly event: string; readonly data: string; readonly retry: number | undefined }

/** How long a stream may give no byte before it counts as lost, in ms: three of the server's 15 s pings. */
export const streamIdleMs = 45_000

/**
 * How long a live stream that ended or dropped, or a read that got no answer, may take before the page shows it, in ms
 * (review R43, bridge-coord's decision): a restart of the server ends every stream, and the server is back within the
 * first two retries (5 s each). A miss within this window is quiet; one after it shows, as before.
 */
export const reconnectGraceMs = 10_000

/** A stream that gave no byte for `streamIdleMs`: the reader closed it. */
export class StreamIdleError extends Error {
  constructor(ms: number) {
    super(`the event stream gave no byte for ${String(ms / 1000)} s`)
    this.name = 'StreamIdleError'
  }
}

/**
 * The SSE frames of `body` as they come; comment lines (the server's pings) give none, but each byte, a ping too,
 * restarts the idle limit. It throws a StreamIdleError when no byte comes for `idleMs`.
 */
export async function* frames(body: ReadableStream<Uint8Array>, idleMs = streamIdleMs): AsyncGenerator<Frame> {
  const decoder = new TextDecoder()
  const reader = body.getReader()
  const read = () =>
    new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => {
      const limit = setTimeout(() => {
        reject(new StreamIdleError(idleMs))
        reader.cancel().catch(() => undefined)
      }, idleMs)
      reader.read().then(
        (result) => {
          clearTimeout(limit)
          resolve(result)
        },
        (error: unknown) => {
          clearTimeout(limit)
          reject(error instanceof Error ? error : new Error(String(error)))
        },
      )
    })
  let text = ''
  try {
    for (;;) {
      const { value, done } = await read()
      if (done) return
      text += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n')
      for (let at = text.indexOf('\n\n'); at !== -1; at = text.indexOf('\n\n')) {
        const block = text.slice(0, at)
        text = text.slice(at + 2)
        let event = 'message'
        const data: string[] = []
        let retry: number | undefined
        for (const line of block.split('\n')) {
          if (line.startsWith(':')) continue
          const colon = line.indexOf(':')
          const key = colon === -1 ? line : line.slice(0, colon)
          const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
          if (key === 'event') event = value
          else if (key === 'data') data.push(value)
          else if (key === 'retry' && /^\d+$/.test(value)) retry = Number(value)
        }
        if (data.length > 0 || retry !== undefined) yield { event, data: data.join('\n'), retry }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
