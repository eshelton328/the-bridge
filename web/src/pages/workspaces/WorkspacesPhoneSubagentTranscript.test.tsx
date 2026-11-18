import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A subagent's full transcript on the phone (M12): the view that the chevron of its card in the subagents opens.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe("a subagent's full transcript on the phone", () => {
  it('shows the task, the tool calls, the messages, Stop and the read-only note, with no tab bar', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubagentTranscript
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const transcript = page.getByRole('region', { name: 'Layout notes' })
    await expect.element(transcript.getByRole('heading', { name: 'Layout notes' })).toBeVisible()
    await expect.element(transcript.getByText('writer agent · 0:34 · 11k tokens')).toBeVisible()
    await expect.element(transcript.getByText('Task from bridge themes')).toBeVisible()
    await expect.element(transcript.getByText('Read captures/the-bridge-requirements.md')).toBeVisible()
    await expect.element(transcript.getByText('Writing layout-notes.md')).toBeVisible()
    await expect.element(transcript.getByRole('button', { name: 'Stop' })).toBeVisible()
    await expect
      .element(transcript.getByText('Read-only: the result returns to bridge themes when it finishes.'))
      .toBeVisible()
    await expect.element(page.getByRole('navigation', { name: 'Trail' })).toBeVisible()
    // The tab bar's tabs carry their Figma layers; the transcript has no tab bar.
    expect(document.querySelector('[data-figma="tab · More"]')).toBeNull()
  })

  it('returns to the subagents, whose chevron opens the transcript again, and the trail returns to the chat', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubagentTranscript
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Subagents' }))
    const list = page.getByRole('region', { name: 'Subagents' })
    await expect.element(list.getByText('3 · 2 running')).toBeVisible()
    await userEvent.click(list.getByRole('button', { name: 'Open the transcript of Layout notes' }))
    await expect.element(page.getByRole('region', { name: 'Layout notes' })).toBeVisible()
    const trail = page.getByRole('navigation', { name: 'Trail' })
    await userEvent.click(trail.getByRole('button', { name: 'Subagents' }))
    await expect.element(page.getByRole('region', { name: 'Subagents' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Open the transcript of Layout notes' }))
    await userEvent.click(
      page.getByRole('navigation', { name: 'Trail' }).getByRole('button', { name: 'bridge themes' }),
    )
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
  })
})
