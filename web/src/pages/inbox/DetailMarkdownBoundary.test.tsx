import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../../errors/retryGuard.ts'
import { testRender } from '../../lib/testRender.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'
import { inboxStates } from './states/index.ts'

// Audit P-6: the task's Why and the question's Context render through MarkdownView. When it throws, only that block
// shows its error; the task's title and actions stay.
vi.mock('@eshelton328/component-library-1701', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  MarkdownView: () => {
    throw new Error('markdown crash')
  },
}))

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetRetries()
  vi.restoreAllMocks()
})

describe('a detail whose markdown fails to render', () => {
  it('keeps the next step and shows the error in place of Why (D1)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { data, ui } = inboxStates.nextStep
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect
      .element(page.getByRole('region', { name: 'Why' }).getByText('This part failed to render.'))
      .toBeVisible()
    await expect.element(page.getByRole('region', { name: 'My notes' })).toBeVisible()
  })

  it('keeps the question and shows the error in place of Context (D2)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { data, ui } = inboxStates.question
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect
      .element(page.getByRole('region', { name: 'Context' }).getByText('This part failed to render.'))
      .toBeVisible()
    await expect.element(page.getByRole('region', { name: 'Choose one' })).toBeVisible()
  })
})
