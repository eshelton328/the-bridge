import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { composeStories } from '@storybook/react-vite'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preview from '../../../.storybook/preview.ts'
import { testRender } from '../../lib/testRender.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { workspacesHome } from './home.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import * as stories from './screens/WorkspacesLiveUnavailable.stories.tsx'
import { workspacesStates } from './states/index.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'

// The live-unavailable notice (audit W-2) shows in the page on every device
// and layout, not only in the status bar that the workbench alone draws.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const title = 'Live data unavailable — showing sample data'
const liveNotice = {
  title,
  description: 'The-bridge server did not answer (502). Start it or check the tailnet, then reload.',
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

const layouts: { name: string; state: ScreenState<WorkspacesData, WorkspacesUi>; width: number; height: number }[] = [
  { name: 'the phone list', state: workspacesHome, width: 390, height: 844 },
  { name: 'the phone chat', state: workspacesStates.phoneChat, width: 390, height: 844 },
  { name: 'the tablet list', state: workspacesHome, width: 756, height: 1158 },
  { name: 'the tablet chat', state: workspacesStates.tabletOneChat, width: 756, height: 1158 },
  { name: 'the desktop sidebar', state: workspacesHome, width: 1512, height: 982 },
  { name: 'the workbench', state: workspacesStates.workbench, width: 1512, height: 982 },
  // The sidebar draws it, the workbench beside it not: one notice (a locator matches one element only).
  { name: 'the workbench beside the sidebar', state: workspacesStates.twoPanes, width: 1512, height: 982 },
]

describe('the live-unavailable notice', () => {
  for (const { name, state, width, height } of layouts)
    it(`shows in ${name} at ${String(width)} px`, async () => {
      await page.viewport(width, height)
      view = await testRender(
        <WorkspacesScreen data={{ ...state.data, liveNotice }} ui={state.ui} viewport="desktop" />,
      )
      const notice = page.getByRole('alert').filter({ hasText: title })
      await expect.element(notice).toBeVisible()
      await expect
        .element(
          notice.getByText('The-bridge server did not answer (502). Start it or check the tailnet, then reload.'),
        )
        .toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Dismiss' }))
      await expect.element(page.getByText(title)).not.toBeInTheDocument()
    })

  it('does not show without a notice, as on the mock path', async () => {
    await page.viewport(390, 844)
    view = await testRender(<WorkspacesScreen data={workspacesHome.data} ui={workspacesHome.ui} viewport="phone" />)
    await expect.element(page.getByText('release notes')).toBeVisible()
    await expect.element(page.getByText(title)).not.toBeInTheDocument()
  })

  const composed = composeStories(stories, preview)
  it('runs the phone story at the phone size', async () => {
    await page.viewport(390, 844)
    const canvasElement = document.createElement('div')
    document.body.append(canvasElement)
    try {
      await composed.Phone.run({ canvasElement })
    } finally {
      canvasElement.remove()
    }
  })
})
