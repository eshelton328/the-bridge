// What a transcript failure sends to the server's log (d-115): the client
// error sender posts the report of a real transcript miss, and its body
// holds no transcript text, no tool target, no server message and no chat ID.
import { ClientErrorReport } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClientErrorSender, type PostReport } from '../../errors/clientErrorSender.ts'
import { addSink, clearReports, getReports } from '../../errors/reporter.ts'
import { watchTranscript } from './liveTranscript.ts'

const chat = 'mac-mini/c-private'
const transcriptText = 'the owner wrote this private line'
const toolTarget = 'cat ~/private/notes.md'
const serverText = 'herdr said: private pane output'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** The server: the stream answers 404, so the read decides; the read answers `read`. */
function stubServer(read: () => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path.endsWith('/transcript/events'))
        return Promise.resolve(json({ error: { kind: 'not-found', message: 'no route', requestId: 'r-1' } }, 404))
      if (path.endsWith('/transcript')) return Promise.resolve(read())
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
}

const stops: (() => void)[] = []

afterEach(() => {
  for (const stop of stops.splice(0)) stop()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  clearReports()
})

/** Watches the chat with the sender as a sink, and gives the bodies it posted once the miss is reported. */
async function postedBodies(read: () => Response): Promise<string[]> {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const bodies: string[] = []
  const post = vi.fn<PostReport>((body) => {
    bodies.push(body)
    return Promise.resolve(204)
  })
  stops.push(addSink(createClientErrorSender({ post })))
  stubServer(read)
  stops.push(watchTranscript(chat, { retryMs: 50 }))
  await expect.poll(() => bodies.length).toBe(1)
  expect(getReports().map((r) => r.error.name)).toEqual(['TranscriptMissError'])
  return bodies
}

function expectNoPageText(body: string) {
  for (const text of [transcriptText, toolTarget, serverText, chat, 'c-private']) expect(body).not.toContain(text)
}

describe('the report of a transcript failure', () => {
  it('sends no transcript text or tool target from a reply the contract refuses', async () => {
    const [body = ''] = await postedBodies(() =>
      json(
        {
          chat,
          earlier: 'no',
          entries: [
            { type: 'user', id: 'u1', text: transcriptText, cut: false },
            { type: 'tool', id: 't1', name: 'Bash', target: toolTarget, running: 'yes' },
          ],
        },
        200,
      ),
    )
    expect(ClientErrorReport.parse(JSON.parse(body))).toMatchObject({
      source: 'query',
      name: 'TranscriptMissError',
      message: 'bad-reply',
    })
    expectNoPageText(body)
  })

  it("sends no server text from an error answer, only the miss's kind", async () => {
    const [body = ''] = await postedBodies(() =>
      json({ error: { kind: 'internal', message: `${serverText}: ${transcriptText}`, requestId: 'r-2' } }, 500),
    )
    expect(ClientErrorReport.parse(JSON.parse(body))).toMatchObject({
      name: 'TranscriptMissError',
      message: 'internal',
    })
    expectNoPageText(body)
  })
})
