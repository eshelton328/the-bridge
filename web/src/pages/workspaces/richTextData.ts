// Test data for the rich text route tests: phoneTapChat's data, with the
// first chat pane's last reply set to the given Markdown. The chat is
// "bridge themes", which a tap on its row in the phone list opens.
import type { ChatEntry, WorkspacesData } from './types.ts'
import { workspacesStates } from './states/index.ts'

/** phoneTapChat's data, with the first chat's reply text set to `text`. */
export function chatWithReply(text: string): WorkspacesData {
  const { data } = workspacesStates.phoneTapChat
  let done = false
  const panes = data.panes.map((pane) => {
    if (pane.type !== 'chat' || done) return pane
    done = true
    const entries = pane.entries.map((entry): ChatEntry => (entry.type === 'assistant' ? { ...entry, text } : entry))
    return { ...pane, entries }
  })
  return { ...data, panes }
}
