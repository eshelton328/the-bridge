import { afterEach, describe, expect, it, vi } from 'vitest'
import { watchInboxChanges } from './inboxClient.ts'

/** A stream that sends `text`, then ends. */
const ended = (text: string) =>
  Promise.resolve(
    new Response(
      new ReadableStream<Uint8Array>({
        start: (c) => {
          c.enqueue(new TextEncoder().encode(text))
          c.close()
        },
      }),
      { status: 200 },
    ),
  )

afterEach(() => {
  vi.useRealTimers()
})

describe('watchInboxChanges (R70)', () => {
  it('calls onOpen on each open of the stream, the first one too', async () => {
    vi.useFakeTimers()
    const open = vi.fn(() => ended('event: open\ndata: {}\n\n'))
    const onOpen = vi.fn()
    // The first miss after a stream that opened waits 0.6 of 0.5 s: the second open is at about 300 ms.
    const stop = watchInboxChanges({ onChange: () => undefined, onOpen, open, random: () => 0.6 })
    await vi.advanceTimersByTimeAsync(200)
    expect(onOpen).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(200)
    expect([open.mock.calls.length, onOpen.mock.calls.length]).toEqual([2, 2])
    stop()
  })

  it("connects again on the jittered backoff when the stream ends, not after the stream's retry time", async () => {
    vi.useFakeTimers()
    const open = vi.fn(() => ended('event: open\nretry: 100\ndata: {}\n\n'))
    // The first miss after a stream that opened waits a random time below 0.5 s: 0.6 of it is 300 ms.
    const stop = watchInboxChanges({ onChange: () => undefined, open, random: () => 0.6 })
    await vi.advanceTimersByTimeAsync(200)
    expect(open).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(200)
    expect(open).toHaveBeenCalledTimes(2)
    stop()
  })

  it('connects at once when the network is online again, and starts the steps again', async () => {
    vi.useFakeTimers()
    const open = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    // Each miss waits the most of its step: tries at 0, 0.5, 1.5 and 3.5 s, then a wait of 8 s.
    const stop = watchInboxChanges({ onChange: () => undefined, open, random: () => 0.999 })
    await vi.advanceTimersByTimeAsync(3600)
    expect(open).toHaveBeenCalledTimes(4)
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(1)
    expect(open).toHaveBeenCalledTimes(5)
    await vi.advanceTimersByTimeAsync(500)
    expect(open).toHaveBeenCalledTimes(6)
    stop()
  })
})
