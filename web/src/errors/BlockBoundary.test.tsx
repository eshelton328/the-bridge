import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { BlockBoundary } from './BlockBoundary.tsx'
import { resetRetries } from './retryGuard.ts'
import { Thrower } from './Thrower.tsx'

afterEach(() => {
  resetRetries()
  vi.restoreAllMocks()
})

describe('BlockBoundary', () => {
  it('shows an inline alert and recovers on Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const control = { fail: true }
    const view = await testRender(
      <BlockBoundary contentKey="readme">
        <Thrower control={control} error={new Error('markdown crash')} />
      </BlockBoundary>,
    )
    await expect.element(page.getByRole('alert').getByText('This part failed to render.')).toBeVisible()
    control.fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByText('Recovered')).toBeVisible()
    await view.unmount()
  })

  it('offers Reload app after two retries that fail within ten seconds', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const view = await testRender(
      <BlockBoundary>
        <Thrower control={{ fail: true }} error={new Error('keeps failing')} />
      </BlockBoundary>,
    )
    await page.getByRole('button', { name: 'Retry' }).click()
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByRole('button', { name: 'Reload app' })).toBeVisible()
    await view.unmount()
  })
})
