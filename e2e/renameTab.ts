// Changes the layout of the e2e workspace (herdrSession.ts) as the owner
// would: renames its first tab with tab.rename on the session's socket.
// herdr then sends tab.renamed with the workspace's ID. A new name each
// time, so each call is a change.
import { z } from 'zod'
import { herdrRequest } from './herdrRequest.ts'

const TabList = z.object({ result: z.object({ tabs: z.array(z.object({ tab_id: z.string() })) }) })

let renames = 0

export async function renameTab(): Promise<void> {
  const tab = TabList.parse(await herdrRequest('tab.list', {})).result.tabs[0]
  if (tab === undefined) throw new Error('the e2e session has no tab')
  renames += 1
  await herdrRequest('tab.rename', { tab_id: tab.tab_id, label: `e2e ${String(renames)}` })
}
