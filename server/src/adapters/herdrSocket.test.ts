import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type FakeHerdrSocket, type FakeSocketMode, startFakeHerdrSocket } from './fakeHerdrSocket.ts'
import { herdrRequest, herdrSubscribe, type SocketFailure } from './herdrSocket.ts'

let socket: FakeHerdrSocket
beforeEach(async () => {
  socket = await startFakeHerdrSocket({ ping: { type: 'pong' } })
})
afterEach(() => socket.close())

// A long line takes longer than the other cases to arrive, so it gets a longer timeout.
const waitMs = (mode: FakeSocketMode) => (mode === 'noNewline' ? 5000 : 300)

const kindOf = async (mode: FakeSocketMode, method = 'ping'): Promise<SocketFailure['kind'] | 'ok'> => {
  socket.answerWith(mode)
  const reply = await herdrRequest(socket.path, method, {}, waitMs(mode))
  return reply.ok ? 'ok' : reply.error.kind
}

describe('herdr socket: one request', () => {
  it("resolves a method's result, also when it comes in many writes", async () => {
    expect(await herdrRequest(socket.path, 'ping', {})).toEqual({ ok: true, value: { type: 'pong' } })
    socket.answerWith('chunked')
    expect(await herdrRequest(socket.path, 'ping', {})).toEqual({ ok: true, value: { type: 'pong' } })
  })

  it("gives herdr's error code and message as a herdrError", async () => {
    expect(await herdrRequest(socket.path, 'agent.list', {})).toEqual({
      ok: false,
      error: {
        kind: 'herdrError',
        code: 'unknown_method',
        message: 'herdr agent.list: unknown_method: no result for agent.list',
      },
    })
  })

  it('names each way the socket can fail', async () => {
    expect(await kindOf('silent')).toBe('timeout')
    expect(await kindOf('closeEarly')).toBe('closed')
    expect(await kindOf('garbage')).toBe('notJson')
    expect(await kindOf('badShape')).toBe('badShape')
    expect(await kindOf('wrongId')).toBe('badShape')
    expect(await kindOf('noNewline')).toBe('tooLong')
  })

  it('stops at a long line also when its end comes in the same chunk', async () => {
    const reply = await herdrRequest(socket.path, 'ping', {}, 1000, 10)
    expect(reply.ok ? undefined : reply.error.kind).toBe('tooLong')
  })

  it("gives the system's error code when the socket is not there", async () => {
    const reply = await herdrRequest(`${socket.path}.none`, 'ping', {})
    expect(reply.ok ? undefined : reply.error).toMatchObject({ kind: 'connect', code: 'ENOENT' })
  })
})

describe('herdr socket: a subscription', () => {
  const endOf = (mode: FakeSocketMode) =>
    new Promise<SocketFailure>((resolve) => {
      socket.answerWith(mode)
      herdrSubscribe(
        socket.path,
        [],
        { onStart: () => undefined, onEvent: () => undefined, onEnd: resolve },
        waitMs(mode),
      )
    })

  it('names each way the start can fail', async () => {
    expect((await endOf('silent')).kind).toBe('timeout')
    expect((await endOf('closeEarly')).kind).toBe('closed')
    expect((await endOf('garbage')).kind).toBe('notJson')
    expect((await endOf('wrongId')).kind).toBe('badShape')
    expect((await endOf('noNewline')).kind).toBe('tooLong')
  })

  it('stops at a long start line also when its end comes in the same chunk', async () => {
    socket.answerWith('normal')
    const failure = await new Promise<SocketFailure>((resolve) => {
      herdrSubscribe(socket.path, [], { onStart: () => undefined, onEvent: () => undefined, onEnd: resolve }, 1000, 10)
    })
    expect(failure.kind).toBe('tooLong')
  })

  it('starts when the start reply comes in many writes', async () => {
    socket.answerWith('chunked')
    await new Promise<void>((resolve, reject) => {
      const stream = herdrSubscribe(socket.path, [], {
        onStart: () => {
          stream.close()
          resolve()
        },
        onEvent: () => undefined,
        onEnd: (failure) => {
          reject(new Error(failure.message))
        },
      })
    })
  })
})
