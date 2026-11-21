import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { InboxRow } from './blocks/InboxRow.tsx'
import { inboxStates } from './states/index.ts'
import { InboxRowView } from './types.ts'

// The list state's first row, parsed so its type is the schema's.
const row = InboxRowView.parse(inboxStates.list.data.groups[0]?.rows[0])

afterEach(() => {
  vi.useRealTimers()
})

// Audit P-7: a touch held on a row opens its actions after 500 ms. A row that unmounts during the hold must not
// open them, because its timer goes with it.
describe('the row long press', () => {
  it('does not open the actions after the row unmounts during the hold', async () => {
    const onActions = vi.fn()
    const view = await testRender(<InboxRow row={row} selected={false} onActions={onActions} phone />)
    const pressable = page.getByText(row.title).element()
    vi.useFakeTimers()
    pressable.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }))
    await view.unmount()
    vi.advanceTimersByTime(600)
    expect(onActions).not.toHaveBeenCalled()
  })

  it('opens the actions after a 500 ms hold on a mounted row', async () => {
    const onActions = vi.fn()
    const view = await testRender(<InboxRow row={row} selected={false} onActions={onActions} phone />)
    vi.useFakeTimers()
    const pressable = page.getByText(row.title).element()
    pressable.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }))
    vi.advanceTimersByTime(600)
    expect(onActions).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
    await view.unmount()
  })
})
