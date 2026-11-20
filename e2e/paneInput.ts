// Types into the status chat's input box, or empties it, as the owner would
// in its terminal: one pane.send_text or pane.send_keys request on the
// session's socket. The fake agent shows the box (fakeAgent.ts).
import { createConnection } from 'node:net'
import { inject } from 'vitest'

function request(method: string, params: Readonly<Record<string, unknown>>): Promise<void> {
  const line = `${JSON.stringify({ id: `e2e:${method}`, method, params })}\n`
  return new Promise((resolve, reject) => {
    const conn = createConnection(inject('herdrSocket'), () => conn.write(line))
    conn.setEncoding('utf8')
    conn.on('error', reject)
    conn.on('data', (reply: string) => {
      conn.end()
      if (reply.includes('"error"')) reject(new Error(`herdr refused ${method}: ${reply}`))
      else resolve()
    })
  })
}

/** Types `text` into the box, with no Enter. */
export const typeInput = (text: string) => request('pane.send_text', { pane_id: inject('statusChat').pane, text })

/** Empties the box: the fake agent's ctrl+u deletes one line, and one more the line break before it. */
export const clearInput = () =>
  request('pane.send_keys', { pane_id: inject('statusChat').pane, keys: Array.from({ length: 8 }, () => 'ctrl+u') })
