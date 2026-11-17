// The Inbox after Erik pressed Start on a next step (InboxUi.started): the
// task shows what its launch's `start` holds, as D6 draws a started task:
// Running, its prompt sent, and the run card of its chat, whose Reply here
// opens the chat (M10 to M8). Pure functions, no React.
import type { InboxData, InboxUi } from '../types.ts'

export function startView(data: InboxData, ui: Pick<InboxUi, 'started'>): InboxData {
  const task = data.detail
  if (task?.kind !== 'next' || task.launch.stage !== 'suggested' || !ui.started.includes(task.id)) return data
  const { start } = task.launch
  return {
    ...data,
    detail: {
      ...task,
      status: start.status,
      origin: start.origin,
      prompt: { ...task.prompt, state: 'sent' },
      launch: { stage: 'started', run: start.run },
    },
  }
}
