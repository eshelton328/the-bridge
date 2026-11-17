import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../../lib/testRender.ts'
import type { Workspace, WorkspacesUi } from '../types.ts'
import { WorkspaceSidebar } from './WorkspaceSidebar.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const status = { label: 'Idle', tone: 'idle' } as const
// D2's omni-brain: bridge themes and drift check have panes; theme tokens, a subtask of bridge themes, has none.
const workspaces: Workspace[] = [
  {
    id: 'omni-brain',
    label: 'omni-brain',
    count: 3,
    needsYou: false,
    chats: [
      { id: 'bridge-themes', kind: 'claude', title: 'bridge themes', model: 'Opus 5.5', status },
      { id: 'theme-tokens', kind: 'claude', title: 'theme tokens', model: 'Opus 5.5', status, level: 1 },
      { id: 'drift-check', kind: 'codex', title: 'drift check', model: 'GPT-5.5', status },
    ],
  },
]
const ui: WorkspacesUi = {
  focusedPane: 'bridge-themes',
  menuFor: null,
  moveOpen: false,
  moveTarget: null,
  skillsFor: null,
  skill: null,
  sidebar: true,
}
const text = {
  title: 'Workspaces',
  hide: 'Hide the workspace sidebar',
  newWorkspace: 'New workspace',
  dropHint: 'Drop to move {chat} into {workspace}',
  contextLabel: 'context',
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the workspace sidebar', () => {
  it('selects only a chat that has a pane to show', async () => {
    const changes: Partial<WorkspacesUi>[] = []
    view = await testRender(
      <WorkspaceSidebar
        text={text}
        workspaces={workspaces}
        selected="bridge-themes"
        openable={['bridge-themes', 'drift-check']}
        ui={ui}
        onUiChange={(change) => changes.push(change)}
      />,
    )
    await userEvent.click(page.getByText('theme tokens'))
    expect(changes).toEqual([])
    await expect.element(page.getByRole('button', { name: 'theme tokens' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'drift check' }))
    expect(changes).toEqual([{ focusedPane: 'drift-check' }])
  })
})
