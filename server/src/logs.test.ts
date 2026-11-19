import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatEntry, parseLine, readLogs, sinceOf } from './logs.ts'

const line = (fields: Record<string, unknown>) =>
  JSON.stringify({ level: 30, time: '2026-11-19T10:00:00.000Z', msg: 'request', ...fields })

describe('pnpm logs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bridge-logs-read-'))
  writeFileSync(
    join(dir, 'bridge-2026-11-19.log'),
    [
      line({ requestId: 'a', status: 200 }),
      'not json',
      line({ requestId: 'b', level: 50, time: '2026-11-19T11:00:00.000Z', msg: 'server error' }),
      line({ requestId: 'a', level: 40, time: '2026-11-19T12:00:00.000Z' }),
      '',
    ].join('\n'),
  )

  it('filters by request ID, by the lowest level and by time', () => {
    expect(readLogs(dir, { requestId: 'a' }).map((e) => e.level)).toEqual([30, 40])
    expect(readLogs(dir, { level: 'warn' }).map((e) => e.requestId)).toEqual(['b', 'a'])
    expect(readLogs(dir, { since: new Date('2026-11-19T11:30:00Z') }).map((e) => e.level)).toEqual([40])
  })

  it('prints one line for each entry and the stack of an error under it', () => {
    const entry = parseLine(line({ requestId: 'a', err: { message: 'boom', stack: 'Error: boom\n    at x' } }))
    if (!entry) throw new Error('no entry')
    expect(formatEntry(entry)).toBe('2026-11-19T10:00:00.000Z INFO  request requestId=a\n  Error: boom\n      at x')
  })

  it('reads a time as minutes, hours or days ago, or as an ISO time', () => {
    const now = new Date('2026-11-19T12:00:00Z')
    expect(sinceOf('15m', now)).toEqual(new Date('2026-11-19T11:45:00Z'))
    expect(sinceOf('2h', now)).toEqual(new Date('2026-11-19T10:00:00Z'))
    expect(sinceOf('2026-11-18T00:00:00Z', now)).toEqual(new Date('2026-11-18T00:00:00Z'))
    expect(sinceOf('soon', now)).toBeUndefined()
  })
})
