import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { ErrorTray } from './ErrorTray.tsx'
import { clearReports, report } from './reporter.ts'

afterEach(() => {
  clearReports()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ErrorTray', () => {
  it('lists two reports with the same message in the same millisecond as two rows, with no key warning (audit W-5)', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.useFakeTimers({ toFake: ['Date'] })
    report(new Error('same message'), 'handler')
    report(new Error('same message'), 'window')
    const view = await testRender(<ErrorTray />)
    await page.getByRole('button', { name: '2 errors' }).click()
    await expect.element(page.getByText('handler · /', { exact: false })).toBeVisible()
    expect(page.getByText(/· same message$/).elements()).toHaveLength(2)
    const keyWarnings = log.mock.calls.filter((call) => call.some((arg) => String(arg).includes('same key')))
    expect(keyWarnings).toEqual([])
    await view.unmount()
  })
})
