import { createElement, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { inAct, testRender, unmountRendered } from './testRender.ts'

// A browser test clicks and types with real events, outside act(). With
// IS_REACT_ACT_ENVIRONMENT always set, React wrote a warning with a component
// stack for each update such an event caused: 36 872 in one CI shard, and a
// click took 5 to 8 s (the-bridge #322, CI run 44877302138).

function Counter() {
  const [count, setCount] = useState(0)
  return createElement(
    'button',
    {
      type: 'button',
      onClick: () => {
        setCount(count + 1)
      },
    },
    `count ${String(count)}`,
  )
}

afterEach(async () => {
  await unmountRendered()
  vi.restoreAllMocks()
})

describe('testRender', () => {
  it('lets a click update the state without an act() warning', async () => {
    const error = vi.spyOn(console, 'error')
    await testRender(createElement(Counter))
    await userEvent.click(page.getByRole('button', { name: 'count 0' }))
    await expect.element(page.getByRole('button', { name: 'count 1' })).toBeVisible()
    expect(error.mock.calls.filter((call) => String(call[0]).includes('act('))).toEqual([])
  })

  it('sets IS_REACT_ACT_ENVIRONMENT only while inAct runs', async () => {
    let inside: unknown
    await inAct(async () => {
      inside = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
      await Promise.resolve()
    })
    expect(inside).toBe(true)
    expect(Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT')).toBe(false)
  })
})
