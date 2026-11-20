import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../../lib/testRender.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
// Imported under another name: the library's Panda preset claims the JSX name `WorkspaceTabs` for its recipe,
// and the Panda lint then reads this test, which Panda does not scan, as a file with styles.
import { WorkspaceTabs as TabsColumn } from './WorkspaceTabs.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// One workspace with one empty pane: enough for the tab bar.
const data: WorkspacesData = {
  railBadge: 0,
  workspaces: [{ id: 'omni-brain', label: 'omni-brain', count: 1, needsYou: false }],
  current: 'omni-brain',
  panes: [
    {
      type: 'empty',
      id: 'empty',
      title: 'Empty pane',
      text: 'Start a chat here, or open one from this workspace.',
      start: [],
      openLabel: 'Open',
      open: [],
    },
  ],
  status: { summary: 'omni-brain · 1 pane', hints: [], alert: '' },
  paneMenu: [],
  newWorkspace: 'New workspace…',
  skillsLabel: 'SKILLS',
  skills: [],
}
const ui: WorkspacesUi = {
  focusedPane: 'empty',
  menuFor: null,
  moveOpen: false,
  moveTarget: null,
  skillsFor: null,
  skill: null,
  sidebar: false,
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the workspace tabs', () => {
  it('shows the sidebar again when the owner clicks the button that shows it', async () => {
    const changes: Partial<WorkspacesUi>[] = []
    view = await testRender(
      <TabsColumn
        data={data}
        ui={ui}
        onUiChange={(change) => changes.push(change)}
        onDraftChange={() => undefined}
        toggle
      />,
    )
    await userEvent.click(page.getByRole('button', { name: 'Show the workspace sidebar' }))
    expect(changes).toEqual([{ sidebar: true }])
  })
})
