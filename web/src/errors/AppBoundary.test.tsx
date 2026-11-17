import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { AppBoundary } from './AppBoundary.tsx'
import { clearReports, getReports } from './reporter.ts'
import { rootErrorOptions } from './rootErrorOptions.ts'
import { Thrower } from './Thrower.tsx'

afterEach(() => {
  clearReports()
  vi.restoreAllMocks()
})

describe('AppBoundary', () => {
  it('shows the app fallback with Reload app, and the root hook reports the error once', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('app crash')
    const view = await testRender(
      <AppBoundary>
        <Thrower control={{ fail: true }} error={error} />
      </AppBoundary>,
      rootErrorOptions,
    )
    await expect.element(page.getByRole('heading', { name: 'The Bridge hit an error' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Reload app' })).toBeVisible()
    expect(getReports().map((r) => [r.source, r.error])).toEqual([['root-caught', error]])
    await view.unmount()
  })
})
