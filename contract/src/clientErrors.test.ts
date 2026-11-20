import { describe, expect, it } from 'vitest'
import { ClientErrorReport } from './clientErrors.ts'

const report = { source: 'query', name: 'Error', message: 'the server answered 503', route: '/workspaces' }

describe('client error reports', () => {
  it('reads a report with or without its stack and request ID', () => {
    expect(ClientErrorReport.parse(report)).toEqual(report)
    const full = { ...report, stack: 'Error: x\n    at y', requestId: 'r1' }
    expect(ClientErrorReport.parse(full)).toEqual(full)
  })

  it('refuses an unknown source, an extra field and a message over 2000 characters', () => {
    expect(ClientErrorReport.safeParse({ ...report, source: 'boundary' }).success).toBe(false)
    expect(ClientErrorReport.safeParse({ ...report, state: { draft: 'text' } }).success).toBe(false)
    expect(ClientErrorReport.safeParse({ ...report, message: 'x'.repeat(2001) }).success).toBe(false)
  })
})
