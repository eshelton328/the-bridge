// The frames of a server-sent event stream (`GET /api/events`, d-112), read
// from a fetch body, as EventSource reads them: the Workspaces watcher and
// transcript streams and the Inbox watcher parse their streams with it.

/** One server-sent event: its name and its data. */
export type Frame = { readonly event: string; readonly data: string; readonly retry: number | undefined }

/** The SSE frames of `body` as they come; comment lines (the server's pings) give none. */
export async function* frames(body: ReadableStream<Uint8Array>): AsyncGenerator<Frame> {
  const decoder = new TextDecoder()
  const reader = body.getReader()
  let text = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
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
