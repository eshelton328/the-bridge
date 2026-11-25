import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { SHIFT_URL, startHeaderShift } from './headerShift.ts'

// The R57 shift (dev only): it moves `#root` down by the dev server's `shiftTop`, live and with `top` only, so a band
// at the top of the iPad's web view that stays belongs to the system and one that moves is drawn by the page.

type FetchShift = (url: string, init: RequestInit) => Promise<Response>

/** A `#root` for this test, removed after it. */
function mountRoot() {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.append(root)
  onTestFinished(() => {
    root.remove()
  })
  return root
}

/** Starts the shift with answers from `reply`, asking every 20 ms; stops it after the test. */
function run(reply: () => Promise<Response>) {
  const fetchShift = vi.fn<FetchShift>(reply)
  const running = startHeaderShift({ fetchShift, everyMs: 20 })
  onTestFinished(running.stop)
  return { fetchShift, running }
}

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

describe('R57 shift', () => {
  it('asks the shift with no cache and moves #root by its answer, live, with top only', async () => {
    const root = mountRoot()
    let shiftTop = 0
    const { fetchShift } = run(() => json({ shiftTop }))
    expect(fetchShift).toHaveBeenCalledWith(SHIFT_URL, { cache: 'no-store' })
    await expect.poll(() => fetchShift.mock.calls.length).toBeGreaterThan(1)
    expect(root.getAttribute('style')).toBeNull()
    shiftTop = 40
    await expect.poll(() => root.style.top).toBe('40px')
    expect(root.style.transform).toBe('')
    expect(root.style.translate).toBe('')
    shiftTop = 0
    await expect.poll(() => root.style.top).toBe('')
  })

  it('holds the shift for as long as the answer stays, and sets top only once', async () => {
    const root = mountRoot()
    const set = vi.spyOn(root.style, 'setProperty')
    const { fetchShift } = run(() => json({ shiftTop: 40 }))
    await expect.poll(() => root.style.top).toBe('40px')
    const asked = fetchShift.mock.calls.length
    await expect.poll(() => fetchShift.mock.calls.length, { timeout: 3000 }).toBeGreaterThan(asked + 10)
    expect(root.style.top).toBe('40px')
    expect(set).toHaveBeenCalledTimes(1)
  })

  it('drops an answer older than one already applied, so a slow 40 never comes after a newer 0', async () => {
    const root = mountRoot()
    const answers: ((body: unknown) => void)[] = []
    const { fetchShift } = run(
      () =>
        new Promise<Response>((done) => {
          answers.push((body) => {
            void json(body).then(done)
          })
        }),
    )
    await expect.poll(() => fetchShift.mock.calls.length).toBeGreaterThan(1)
    // The second ask answers 0 first; the first ask's 40 arrives after it.
    answers[1]?.({ shiftTop: 0 })
    await new Promise((done) => setTimeout(done, 10))
    answers[0]?.({ shiftTop: 40 })
    await new Promise((done) => setTimeout(done, 30))
    expect(root.style.top).toBe('')
  })

  it('takes a failed, odd or out-of-range answer as 0', async () => {
    const root = mountRoot()
    const answers: (() => Promise<Response>)[] = [
      () => json({ shiftTop: 40 }),
      () => json({ shiftTop: 40 }, 500),
      () => json({ shiftTop: 40 }),
      () => json({ shiftTop: '40' }),
      () => json({ shiftTop: 40 }),
      () => json({ shiftTop: 40.5 }),
      () => json({ shiftTop: 40 }),
      () => json({ shiftTop: 201 }),
      () => json({ shiftTop: 40 }),
      () => json({ shiftTop: -4 }),
      () => json({ shiftTop: 40 }),
      () => Promise.reject(new TypeError('Failed to fetch')),
      () => json({ shiftTop: 40 }),
      () => Promise.resolve(new Response('not json')),
    ]
    const seen: string[] = []
    let next = 0
    const { fetchShift } = run(() => {
      seen.push(root.style.top)
      return (answers[Math.min(next++, answers.length - 1)] ?? (() => json({})))()
    })
    await expect.poll(() => fetchShift.mock.calls.length, { timeout: 3000 }).toBeGreaterThan(answers.length + 1)
    // Each odd answer put #root back, so the next ask saw it at 0 after a 40.
    expect(seen.slice(1, answers.length + 1)).toEqual(answers.map((_, index) => (index % 2 === 0 ? '40px' : '')))
    expect(root.style.top).toBe('')
  })

  it('puts #root back and asks no more once stopped, even with an answer still out', async () => {
    const root = mountRoot()
    let release: (() => void) | undefined
    const { fetchShift, running } = run(() => json({ shiftTop: 40 }))
    await expect.poll(() => root.style.top).toBe('40px')
    fetchShift.mockImplementation(
      () =>
        new Promise<Response>((done) => {
          release = () => {
            void json({ shiftTop: 80 }).then(done)
          }
        }),
    )
    await expect.poll(() => release).toBeDefined()
    running.stop()
    expect(root.style.top).toBe('')
    const calls = fetchShift.mock.calls.length
    release?.()
    await new Promise((done) => setTimeout(done, 80))
    expect(root.style.top).toBe('')
    expect(fetchShift.mock.calls.length).toBe(calls)
  })

  it('does nothing with no #root', async () => {
    const { fetchShift } = run(() => json({ shiftTop: 40 }))
    await expect.poll(() => fetchShift.mock.calls.length).toBeGreaterThan(1)
    expect(document.getElementById('root')).toBeNull()
  })
})
