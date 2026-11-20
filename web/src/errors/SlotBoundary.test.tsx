import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { clearReports, getReports } from './reporter.ts'
import { resetRetries } from './retryGuard.ts'
import { rootErrorOptions } from './rootErrorOptions.ts'
import { SlotBoundary } from './SlotBoundary.tsx'
import { Thrower } from './Thrower.tsx'

afterEach(() => {
  resetRetries()
  clearReports()
  vi.restoreAllMocks()
})

describe('SlotBoundary', () => {
  it('shows the fallback in the slot, keeps its siblings, reports once and recovers on Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const control = { fail: true }
    const crash = new Error('slot crash')
    const view = await testRender(
      <>
        <nav>Tab bar</nav>
        <SlotBoundary contentKey="chat-1">
          <Thrower control={control} error={crash} />
        </SlotBoundary>
      </>,
      rootErrorOptions,
    )
    await expect.element(page.getByRole('heading', { name: 'This part of the page failed to render' })).toBeVisible()
    await expect.element(page.getByText('Tab bar')).toBeVisible()
    expect(getReports().filter((r) => r.error === crash)).toHaveLength(1)
    expect(getReports().at(-1)?.source).toBe('root-caught')
    control.fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByText('Recovered')).toBeVisible()
    await view.unmount()
  })

  it('adds no element around the slot content', async () => {
    const view = await testRender(
      <section aria-label="slot">
        <SlotBoundary contentKey="list">
          <p>Content</p>
        </SlotBoundary>
      </section>,
    )
    await expect.element(page.getByText('Content')).toBeVisible()
    expect(page.getByText('Content').element().parentElement?.getAttribute('aria-label')).toBe('slot')
    await view.unmount()
  })
})
