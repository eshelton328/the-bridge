// The SSE reader's idle limit (review R43b): a stream with no byte for 45 s is lost and closed, and a ping comment
// every 15 s keeps it open, though it gives no frame.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { frames, StreamIdleError, streamIdleMs } from './eventFrames.ts'

afterEach(() => {
  vi.useRealTimers()
})

/** A body the test writes to, and whether the reader cancelled it. */
function stream() {
  const encoder = new TextEncoder()
  let control: ReadableStreamDefaultController<Uint8Array> | undefined
  const seen = { cancelled: false }
  const body = new ReadableStream<Uint8Array>({
    start: (c) => {
      control = c
    },
    cancel: () => {
      seen.cancelled = true
    },
  })
  return { body, seen, write: (text: string) => control?.enqueue(encoder.encode(text)) }
}

/** Reads every frame of `body` into `got`, and the error that ended it into `ended`. */
function readAll(body: ReadableStream<Uint8Array>) {
  const got: string[] = []
  const ended: { error: unknown; done: boolean } = { error: undefined, done: false }
  void (async () => {
    try {
      for await (const frame of frames(body)) got.push(frame.event)
      ended.done = true
    } catch (error) {
      ended.error = error
    }
  })()
  return { got, ended }
}

describe('the idle limit of an event stream (R43b)', () => {
  it('closes a stream that gives no byte for 45 s and throws a StreamIdleError', async () => {
    vi.useFakeTimers()
    const { body, seen, write } = stream()
    const read = readAll(body)
    write('event: open\ndata: {}\n\n')
    await vi.advanceTimersByTimeAsync(streamIdleMs - 1)
    expect(read.ended.error).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(read.ended.error).toBeInstanceOf(StreamIdleError)
    expect(seen.cancelled).toBe(true)
    expect(read.got).toEqual(['open'])
  })

  it('keeps a stream open for 2 min of pings every 15 s and no event, and gives no frame for a ping', async () => {
    vi.useFakeTimers()
    const { body, seen, write } = stream()
    const read = readAll(body)
    write('event: open\ndata: {}\n\n')
    for (let at = 0; at < 8; at += 1) {
      await vi.advanceTimersByTimeAsync(15_000)
      write(': ping\n\n')
    }
    await vi.advanceTimersByTimeAsync(1)
    expect(read.ended.error).toBeUndefined()
    expect(seen.cancelled).toBe(false)
    expect(read.got).toEqual(['open'])
  })
})
