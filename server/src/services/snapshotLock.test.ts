import { describe, expect, it } from 'vitest'
import { createSnapshotLock, snapshotKey } from './snapshotLock.ts'

describe('createSnapshotLock', () => {
  it('runs the work of one key one at a time, in order, and other keys at once', async () => {
    const lock = createSnapshotLock()
    const order: string[] = []
    let open: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      open = resolve
    })
    const first = lock.hold('a/b', async () => {
      order.push('first start')
      await gate
      order.push('first end')
    })
    const second = lock.hold('a/b', () => {
      order.push('second')
      return Promise.resolve()
    })
    await lock.hold('c/d', () => {
      order.push('other')
      return Promise.resolve()
    })
    expect(order).toEqual(['first start', 'other'])
    open()
    await Promise.all([first, second])
    expect(order).toEqual(['first start', 'other', 'first end', 'second'])
  })

  it('frees the lock when a work throws, and gives the throw to its caller only', async () => {
    const lock = createSnapshotLock()
    const thrown = lock.hold('a/b', () => Promise.reject(new Error('boom')))
    const next = lock.hold('a/b', () => Promise.resolve('next'))
    await expect(thrown).rejects.toThrow('boom')
    await expect(next).resolves.toBe('next')
  })

  it('keys a snapshot by the GitHub owner and name in lower case', () => {
    expect(snapshotKey({ owner: 'Owner', name: 'The-Repo' })).toBe(snapshotKey({ owner: 'owner', name: 'the-repo' }))
  })
})
