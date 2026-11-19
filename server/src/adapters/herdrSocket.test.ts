import { describe, expect, it } from 'vitest'
import { startFakeHerdrSocket } from './fakeHerdrSocket.ts'
import { herdrRequest } from './herdrSocket.ts'

describe('herdr socket', () => {
  it("resolves a method's result", async () => {
    const socket = await startFakeHerdrSocket({ ping: { type: 'pong' } })
    expect(await herdrRequest(socket.path, 'ping', {})).toEqual({ ok: true, value: { type: 'pong' } })
    await socket.close()
  })

  it("gives herdr's error code and message", async () => {
    const socket = await startFakeHerdrSocket({})
    expect(await herdrRequest(socket.path, 'agent.list', {})).toEqual({
      ok: false,
      error: 'herdr agent.list: unknown_method: no result for agent.list',
    })
    await socket.close()
  })
})
