// Changes the layout of the e2e workspace (herdrSession.ts) as the owner
// would: renames its first tab with tab.rename on the session's socket.
// herdr then sends tab.renamed with the workspace's ID. A new name each
// time, so each call is a change.
import { createConnection } from 'node:net'
import { inject } from 'vitest'
import { z } from 'zod'

const TabList = z.object({ result: z.object({ tabs: z.array(z.object({ tab_id: z.string() })) }) })

let renames = 0

/** One request on the session's socket; its reply line, parsed. */
function request(method: string, params: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let reply = ''
    const conn = createConnection(inject('herdrSocket'), () =>
      conn.write(`${JSON.stringify({ id: `e2e:${method}`, method, params })}\n`),
    )
    conn.setEncoding('utf8')
    conn.on('error', reject)
    conn.on('data', (chunk: string) => {
      reply += chunk
      if (!reply.includes('\n')) return
      conn.end()
      if (reply.includes('"error"')) reject(new Error(`herdr refused ${method}: ${reply}`))
      else resolve(JSON.parse(reply))
    })
  })
}

export async function renameTab(): Promise<void> {
  const tab = TabList.parse(await request('tab.list', {})).result.tabs[0]
  if (tab === undefined) throw new Error('the e2e session has no tab')
  renames += 1
  await request('tab.rename', { tab_id: tab.tab_id, label: `e2e ${String(renames)}` })
}
