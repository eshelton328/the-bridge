// Sets the status chat's status in herdr (herdrSession.ts), as an agent's
// hook would: one pane.report_agent request on the session's socket, under
// the source the fake agent uses (fakeAgent.ts).
import { createConnection } from 'node:net'
import { inject } from 'vitest'

export function reportAgent(state: 'working' | 'idle' | 'blocked'): Promise<void> {
  const request = {
    id: `e2e:${state}`,
    method: 'pane.report_agent',
    params: { pane_id: inject('statusChat').pane, source: 'bridge-e2e', agent: 'claude', state },
  }
  return new Promise((resolve, reject) => {
    const conn = createConnection(inject('herdrSocket'), () => conn.write(`${JSON.stringify(request)}\n`))
    conn.setEncoding('utf8')
    conn.on('error', reject)
    conn.on('data', (reply: string) => {
      conn.end()
      if (reply.includes('"error"')) reject(new Error(`herdr refused pane.report_agent: ${reply}`))
      else resolve()
    })
  })
}
