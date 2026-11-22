import { ClientErrorReport } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  createClientErrorSender,
  installClientErrorSender,
  maxWaiting,
  pauseAfterLimitMs,
  type PostReport,
  toClientErrorReport,
} from './clientErrorSender.ts'
import { addSink, clearReports, type ErrorReport, type ErrorSource, getReports, report } from './reporter.ts'

afterEach(() => {
  clearReports()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

const entry = (error: Error, source: ErrorSource = 'handler', route = '/workspaces'): ErrorReport => ({
  seq: 1,
  error,
  source,
  componentStack: '    at ChatPane',
  route,
  at: '2026-11-20T00:00:00.000Z',
})

/** Lets the sender's queue run: each post answers on a later task. */
const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })

/** A post that records each body it got and answers `status` (a number, or a function of the call's number). */
function recorder(status: number | ((call: number) => number) = 204) {
  const bodies: unknown[] = []
  const post = vi.fn<PostReport>((body) => {
    bodies.push(JSON.parse(body))
    return Promise.resolve(typeof status === 'number' ? status : status(bodies.length))
  })
  return { bodies, post }
}

/** An error named like one of the page's misses, with its kind in `miss` and page text in its message. */
class NamedError extends Error {
  readonly miss: string

  constructor(name: string, message: string, miss: string) {
    super(message)
    this.name = name
    this.miss = miss
  }
}

describe('toClientErrorReport', () => {
  it("maps each source, keeps the error's name and own message, and passes the contract's schema", () => {
    const sources: [ErrorSource, string][] = [
      ['root-caught', 'reactRoot'],
      ['root-uncaught', 'reactRoot'],
      ['root-recoverable', 'reactRoot'],
      ['window', 'windowError'],
      ['rejection', 'unhandledRejection'],
      ['handler', 'handler'],
      ['shell', 'diagnostic'],
      ['live', 'query'],
      ['query', 'query'],
      ['mutation', 'query'],
    ]
    for (const [source, sent] of sources) {
      const body = toClientErrorReport(entry(new TypeError('x is undefined'), source))
      expect(body).toMatchObject({ source: sent, name: 'TypeError', message: 'x is undefined', route: '/workspaces' })
      expect(ClientErrorReport.safeParse(body).success).toBe(true)
    }
  })

  it('sends the path only, the stack frames without the header, and no component stack', () => {
    const error = new Error('it broke')
    const body = toClientErrorReport(entry(error, 'handler', '/workspaces?state=chat#top'))
    expect(body?.route).toBe('/workspaces')
    expect(body?.stack).toBeDefined()
    expect(body?.stack).not.toContain('it broke')
    expect(body?.stack?.split('\n').every((line) => /^\s*at\s/.test(line) || line.includes('@'))).toBe(true)
    expect(Object.keys(body ?? {}).sort()).toEqual(['message', 'name', 'route', 'source', 'stack'])
  })

  it("cuts the message, name and route to the contract's limits", () => {
    const body = toClientErrorReport(entry(new TypeError('m'.repeat(5000)), 'handler', `/${'p'.repeat(800)}`))
    expect(body?.message).toHaveLength(2000)
    expect(body?.route).toHaveLength(500)
    const named = new Error('x')
    named.name = 'N'.repeat(300)
    expect(toClientErrorReport(entry(named))?.name).toHaveLength(200)
  })

  it('sends the own message of the allowlisted errors only', () => {
    const allowed = [
      new TypeError('a'),
      new RangeError('b'),
      new ReferenceError('c'),
      new EvalError('d'),
      new URIError('e'),
    ]
    for (const error of allowed) expect(toClientErrorReport(entry(error))?.message).toBe(error.message)
    for (const name of ['ShellDiagnosticError', 'FixtureError']) {
      const error = new Error('library or sample text')
      error.name = name
      expect(toClientErrorReport(entry(error))?.message).toBe('library or sample text')
    }
  })

  it('sends an empty message for a plain Error and an error class it does not know, and no text in the stack', () => {
    const secret = 'the draft the owner was typing'
    class SomeNewError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'SomeNewError'
      }
    }
    for (const error of [new SomeNewError(`could not send: ${secret}`), new Error(`failed: ${secret}`)]) {
      const body = toClientErrorReport(entry(error))
      expect(body).toMatchObject({ name: error.name, message: '' })
      expect(JSON.stringify(body)).not.toContain(secret)
    }
  })

  it('sends only the name and kind of an error whose message can hold page or server text', () => {
    const secret = 'my private transcript line'
    const misses = [
      new NamedError('TranscriptMissError', `A chat transcript read missed: status 404 (chat ${secret})`, 'status'),
      new NamedError('LayoutReadMissError', `A workspace layout read missed: ${secret}`, 'internal'),
      new NamedError('ChatUploadMissError', `A chat upload missed: chunk internal 500 (${secret}.png)`, 'internal'),
      new NamedError(
        'LayoutWriteMissError',
        `A layout close missed: herdr-unavailable 503 (${secret})`,
        'herdr-unavailable',
      ),
      new NamedError(
        'ArtifactsMissError',
        `An artifacts request missed: add internal 500 (${secret})`,
        'add internal 500',
      ),
    ]
    for (const error of misses) {
      const body = toClientErrorReport(entry(error, 'live'))
      expect(body).toMatchObject({ name: error.name, message: error.miss })
      expect(JSON.stringify(body)).not.toContain(secret)
    }
    const live = Object.assign(new Error(`the server answered 500: ${secret}`), {
      miss: { kind: 'internal', requestId: 'r-5' },
    })
    live.name = 'LiveMissError'
    expect(toClientErrorReport(entry(live, 'query'))).toMatchObject({
      name: 'LiveMissError',
      message: 'internal',
      requestId: 'r-5',
    })
    expect(JSON.stringify(toClientErrorReport(entry(live, 'query')))).not.toContain(secret)
  })

  it('sends no text that a SyntaxError or a ZodError quotes from what it read', () => {
    const secret = 'secret draft text'
    let syntax = new Error('none')
    try {
      JSON.parse(secret)
    } catch (thrown) {
      if (thrown instanceof Error) syntax = thrown
    }
    expect(syntax.message).toContain('secret')
    const syntaxBody = toClientErrorReport(entry(syntax, 'root-caught'))
    expect(syntaxBody).toMatchObject({ name: 'SyntaxError', message: '' })
    expect(JSON.stringify(syntaxBody)).not.toContain('secret')
    const zod = z.strictObject({ a: z.string() }).safeParse({ a: 1, [secret]: true }).error
    expect(zod?.message).toContain(secret)
    const zodBody = zod === undefined ? undefined : toClientErrorReport(entry(zod, 'root-caught'))
    expect(zodBody).toMatchObject({ name: 'ZodError', message: 'invalid_type, unrecognized_keys' })
    expect(JSON.stringify(zodBody)).not.toContain(secret)
  })
})

describe('createClientErrorSender', () => {
  it('posts each report once, one at a time, as JSON the contract reads', async () => {
    const { bodies, post } = recorder()
    const sink = createClientErrorSender({ post })
    sink(entry(new TypeError('first')))
    sink(entry(new TypeError('second')))
    expect(post).toHaveBeenCalledTimes(1)
    await settle()
    expect(bodies.map((b) => ClientErrorReport.parse(b).message)).toEqual(['first', 'second'])
  })

  it('stops sending after a 429 until the window has passed, with no retry of the refused report', async () => {
    let clock = 1000
    const { bodies, post } = recorder((call) => (call === 1 ? 429 : 204))
    const sink = createClientErrorSender({ post, now: () => clock })
    sink(entry(new TypeError('limited')))
    sink(entry(new TypeError('waiting')))
    await settle()
    expect(post).toHaveBeenCalledTimes(1)
    clock += pauseAfterLimitMs - 1
    sink(entry(new TypeError('in the window')))
    await settle()
    expect(post).toHaveBeenCalledTimes(1)
    clock += 1
    sink(entry(new TypeError('after the window')))
    await settle()
    expect(bodies.map((b) => ClientErrorReport.parse(b).message)).toEqual(['limited', 'after the window'])
  })

  it('drops a report the server refuses with 400, warns once in development, and sends the next', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { bodies, post } = recorder((call) => (call === 1 ? 400 : 204))
    const sink = createClientErrorSender({ post })
    sink(entry(new TypeError('refused')))
    sink(entry(new TypeError('next')))
    await settle()
    expect(bodies.map((b) => ClientErrorReport.parse(b).message)).toEqual(['refused', 'next'])
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('drops a report when no answer comes, and sends the next', async () => {
    const bodies: string[] = []
    const post = vi.fn<PostReport>((body) => {
      bodies.push(body)
      return bodies.length === 1 ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(204)
    })
    const sink = createClientErrorSender({ post })
    sink(entry(new TypeError('lost')))
    sink(entry(new TypeError('next')))
    await settle()
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('aborts a post that gets no answer in 8 s, drops it and sends the next', async () => {
    const postTimeoutMs = 8000
    vi.useFakeTimers()
    const sent: string[] = []
    const aborted: string[] = []
    // The fetch's own signal: the sender's, when it passes one.
    const post = vi.fn<PostReport>((body, ...rest: unknown[]) => {
      const { message } = ClientErrorReport.parse(JSON.parse(body))
      sent.push(message)
      if (message !== 'stalled') return Promise.resolve(204)
      const [signal] = rest
      // The server took the post and never answers: only the abort ends it.
      return new Promise<number>((_resolve, reject) => {
        if (signal instanceof AbortSignal)
          signal.addEventListener('abort', () => {
            aborted.push(message)
            reject(new DOMException('aborted', 'AbortError'))
          })
      })
    })
    const sink = createClientErrorSender({ post })
    sink(entry(new TypeError('stalled')))
    sink(entry(new TypeError('next')))
    await vi.advanceTimersByTimeAsync(postTimeoutMs - 1)
    expect(sent).toEqual(['stalled'])
    await vi.advanceTimersByTimeAsync(1)
    expect(aborted).toEqual(['stalled'])
    expect(sent).toEqual(['stalled', 'next'])
  })

  it(`keeps at most ${String(maxWaiting)} reports waiting`, async () => {
    const { post } = recorder()
    const sink = createClientErrorSender({ post })
    for (let i = 0; i < maxWaiting + 10; i += 1) sink(entry(new TypeError(String(i))))
    await settle()
    // The first is sent at once; the next maxWaiting wait.
    expect(post).toHaveBeenCalledTimes(maxWaiting + 1)
  })
})

describe('no loop', () => {
  it('never reports a failed send and never throws into the reporter', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing = [
      vi.fn<PostReport>(() => Promise.reject(new TypeError('Failed to fetch'))),
      vi.fn<PostReport>(() => {
        throw new Error('post threw')
      }),
      vi.fn<PostReport>(() => Promise.resolve(500)),
    ]
    for (const post of failing) {
      clearReports()
      const remove = addSink(createClientErrorSender({ post }))
      expect(() => {
        report(new Error('the one crash'), 'handler')
      }).not.toThrow()
      await settle()
      remove()
      expect(post).toHaveBeenCalledTimes(1)
      expect(getReports().map((r) => r.error.message)).toEqual(['the one crash'])
    }
  })
})

describe('installClientErrorSender', () => {
  it('sends in a build that reads the live server, and nothing in a production build on fixtures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { post } = recorder()
    const remove = installClientErrorSender({ post })
    report(new Error('live build'), 'handler')
    remove()
    await settle()
    expect(post).toHaveBeenCalledTimes(1)
    vi.stubEnv('DEV', false)
    const removeInBuild = installClientErrorSender({ post })
    report(new Error('production build'), 'handler')
    removeInBuild()
    await settle()
    expect(post).toHaveBeenCalledTimes(1)
  })
})
