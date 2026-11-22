import { describe, expect, it } from 'vitest'
import { processAncestors } from './processAncestors.ts'

describe('processAncestors', () => {
  it('gives this process and its parent, and never pid 1', async () => {
    const found = await processAncestors(process.pid)
    expect(found.has(process.pid)).toBe(true)
    expect(found.has(process.ppid)).toBe(true)
    expect(found.has(1)).toBe(false)
  })

  it('gives only the pid itself for a process that is not there', async () => {
    expect([...(await processAncestors(2 ** 22 + 12_345))]).toEqual([2 ** 22 + 12_345])
  })
})
