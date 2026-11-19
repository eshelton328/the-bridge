// The Inbox after the owner pressed Start on a next step (InboxUi.started): the
// task shows what its launch's `start` holds, as D5 and D6 draw a started
// task: Running, its prompt sent, and the run card of its chat, whose Reply
// here opens the chat (M10 to M8). Its row leaves Next steps for the
// Running group, with the Next steps and Running chips counting it there.
// Pure functions, no React.
import type { InboxData, InboxGroupView, InboxRowView, InboxUi } from '../types.ts'

/** The groups with the started row moved from Next steps to the end of Running, which is added when the state has none. */
function moveToRunning(groups: readonly InboxGroupView[], row: InboxRowView): InboxGroupView[] {
  const moved = groups.map((group) =>
    group.id === 'nextSteps'
      ? { ...group, count: group.count - 1, rows: group.rows.filter((r) => r.id !== row.id) }
      : group.id === 'running'
        ? { ...group, count: group.count + 1, rows: [...group.rows, row] }
        : group,
  )
  if (groups.some((group) => group.id === 'running')) return moved
  return [...moved, { id: 'running', label: 'Running', count: 1, dot: 'working', rows: [row] }]
}

export function startView(data: InboxData, ui: Pick<InboxUi, 'started'>): InboxData {
  const task = data.detail
  if (task?.kind !== 'next' || task.launch.stage !== 'suggested' || !ui.started.includes(task.id)) return data
  const { start } = task.launch
  const waiting = data.groups.find((group) => group.id === 'nextSteps')?.rows.find((r) => r.id === task.id)
  const list =
    waiting === undefined
      ? {}
      : {
          groups: moveToRunning(data.groups, { ...waiting, running: start.row }),
          filters: data.filters.map((f) =>
            f.value === 'next'
              ? { ...f, count: f.count - 1 }
              : f.value === 'running'
                ? { ...f, count: f.count + 1 }
                : f,
          ),
        }
  return {
    ...data,
    ...list,
    detail: {
      ...task,
      status: start.status,
      origin: start.origin,
      prompt: { ...task.prompt, state: 'sent' },
      launch: { stage: 'started', run: start.run },
    },
  }
}
