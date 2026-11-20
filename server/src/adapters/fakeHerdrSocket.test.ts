import { createConnection } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type FakeHerdrSocket, startFakeHerdrSocket } from './fakeHerdrSocket.ts'

let socket: FakeHerdrSocket
beforeAll(async () => {
  socket = await startFakeHerdrSocket({ 'workspace.list': { workspaces: [] } })
})
afterAll(() => socket.close())

/** Sends `text` on a new connection and resolves the first line of the answer. */
const ask = (text: string) =>
  new Promise<string>((resolve, reject) => {
    const conn = createConnection(socket.path, () => conn.write(text))
    let answer = ''
    conn.setEncoding('utf8')
    conn.on('data', (chunk: string) => {
      answer += chunk
      if (answer.includes('\n')) {
        conn.destroy()
        resolve(answer.slice(0, answer.indexOf('\n')))
      }
    })
    conn.on('error', reject)
  })

describe('the fake herdr socket', () => {
  it('answers a request that is not JSON with an error line and keeps serving', async () => {
    expect(JSON.parse(await ask('not json\n'))).toMatchObject({ error: { code: 'invalid_request' } })
    expect(JSON.parse(await ask(`${JSON.stringify({ id: 'a:1', method: 'workspace.list' })}\n`))).toEqual({
      id: 'a:1',
      result: { workspaces: [] },
    })
  })
})
