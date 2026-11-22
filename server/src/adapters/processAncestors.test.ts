import { describe, expect, it } from 'vitest'
import { processAncestors } from './processAncestors.ts'

describe('processAncestors', () => {
  it('gives this process and its parent, and never pid 1', async () => {
    const found = await processAncestors(process.pid)
    expect(found?.has(process.pid)).toBe(true)
    expect(found?.has(process.ppid)).toBe(true)
    expect(found?.has(1)).toBe(false)
  })

  it('gives undefined for a process that is not there, so no close trusts a part of the tree', async () => {
    expect(await processAncestors(2 ** 22 + 12_345)).toBeUndefined()
  })

  it('gives undefined when ps fails on the way up, at a loop and past 64 steps', async () => {
    const tree = new Map([
      [30, 20],
      [20, 10],
      [10, 1],
    ])
    const parent = (pid: number) => Promise.resolve(tree.get(pid))
    expect([...((await processAncestors(30, parent)) ?? [])]).toEqual([30, 20, 10])
    tree.delete(10)
    expect(await processAncestors(30, parent)).toBeUndefined()
    expect(await processAncestors(5, (pid) => Promise.resolve(pid === 5 ? 6 : 5))).toBeUndefined()
    expect(await processAncestors(1000, (pid) => Promise.resolve(pid + 1))).toBeUndefined()
  })
})
