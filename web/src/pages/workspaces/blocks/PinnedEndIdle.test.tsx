import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { usePinnedEnd } from './usePinnedEnd.ts'

// The hook alone, in the scroll frame's shape it reads (a body beside the footer it is given).
function Probe({ onIdle }: { readonly onIdle: (idle: () => Promise<void>) => void }) {
  const { ref, idle } = usePinnedEnd(true, 'chat', undefined)
  onIdle(idle)
  return (
    <div className="scroll-frame__root">
      <div className="scroll-frame__body" />
      <footer ref={ref} />
    </div>
  )
}

const host = document.createElement('div')
afterEach(() => {
  host.remove()
})

describe('usePinnedEnd idle', () => {
  it('ends the wait when the transcript unmounts under a resting finger', async () => {
    document.body.append(host)
    const root = createRoot(host)
    let idle: (() => Promise<void>) | undefined
    await act(async () => {
      root.render(
        <Probe
          onIdle={(given) => {
            idle = given
          }}
        />,
      )
      await Promise.resolve()
    })
    const body = host.querySelector('.scroll-frame__body')
    if (!(body instanceof HTMLElement) || idle === undefined) throw new Error('no hook')
    body.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }))
    let done = false
    void idle().then(() => {
      done = true
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(done).toBe(false)
    // The pane closes with the finger still down: no touchend comes.
    act(() => {
      root.unmount()
    })
    await expect.poll(() => done, { timeout: 1000, interval: 50 }).toBe(true)
  })
})
