import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { PaneSlot } from './PaneSlot.tsx'
import { resetRetries } from './retryGuard.ts'
import { Thrower } from './Thrower.tsx'

afterEach(() => {
  resetRetries()
  vi.restoreAllMocks()
})

describe('PaneSlot and PaneBoundary', () => {
  it('keeps the pane title, shows the fallback in the pane and recovers on Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const control = { fail: true }
    const onClosePane = vi.fn()
    const view = await testRender(
      <PaneSlot title="Write the tickets" contentKey="chat-1" onClosePane={onClosePane}>
        <Thrower control={control} error={new Error('pane crash')} />
      </PaneSlot>,
    )
    await expect.element(page.getByRole('heading', { name: 'This pane failed to render' })).toBeVisible()
    await expect.element(page.getByText('Write the tickets')).toBeVisible()
    await page.getByRole('button', { name: 'Close pane' }).click()
    expect(onClosePane).toHaveBeenCalledOnce()
    control.fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByText('Recovered')).toBeVisible()
    await view.unmount()
  })
})
