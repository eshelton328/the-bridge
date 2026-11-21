import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../errors/retryGuard.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { renderInbox } from './inboxRouteHelpers.ts'

// Audit P-6 on the owner's path: the task opened from the phone list. Its Why renders through MarkdownView; when that
// throws, only Why shows the error, and Back stays. The screen tests are in pages/inbox/DetailMarkdownBoundary.test.tsx.
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
  resetAllStores()
  vi.restoreAllMocks()
  await page.viewport(1512, 982)
})

describe('a task whose markdown fails to render', () => {
  it('keeps the task the owner opens from the phone list and shows the error in place of Why', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(390, 844)
    view = await renderInbox('list').rendered
    await page.getByText('Write the tickets for increment one').click()
    await expect
      .element(page.getByRole('region', { name: 'Why' }).getByText('This part failed to render.'))
      .toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Back to Inbox' })).toBeVisible()
  })
})
