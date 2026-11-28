import { useEffect, useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { pendingTiming } from '../../lib/pendingTiming.ts'
import { renderedUntil } from '../../lib/rendering.ts'
import { inAct, testRender, unmountRendered } from '../../lib/testRender.ts'
import { useSettledState } from './useSettledState.ts'

// A loading layout that shows stays for pendingMinMs, also when a quick read brings a state in place of the slow
// one's promise (the review of the-bridge #624). The clock stands still until the test moves it.
let setLoaded: ((next: string | Promise<string>) => void) | undefined

function Probe({ onSetter }: { readonly onSetter: (set: (next: string | Promise<string>) => void) => void }) {
  const [loaded, setLoaded] = useState<string | Promise<string>>(() => new Promise<string>(() => undefined))
  useEffect(() => {
    onSetter(setLoaded)
  }, [onSetter])
  return <p data-testid="probe">{useSettledState(loaded) ?? 'loading'}</p>
}

const shown = () => document.querySelector('[data-testid="probe"]')?.textContent

afterEach(async () => {
  await unmountRendered()
  vi.useRealTimers()
})

it('keeps the loading layout for pendingMinMs when a state comes in place of the read', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  await testRender(
    <Probe
      onSetter={(set) => {
        setLoaded = set
      }}
    />,
  )
  await renderedUntil(() => shown() === 'loading')
  await inAct(async () => {
    setLoaded?.('loaded')
    await Promise.resolve()
  })
  await renderedUntil(() => true)
  expect(shown()).toBe('loading')
  vi.advanceTimersByTime(pendingTiming.defaultPendingMinMs - 1)
  await renderedUntil(() => true)
  expect(shown()).toBe('loading')
  vi.advanceTimersByTime(1)
  await renderedUntil(() => shown() === 'loaded')
})
