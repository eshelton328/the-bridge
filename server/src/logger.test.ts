import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { dailyFiles, type LogMessage, memoryLogger } from './logger.ts'

const token = 'planted-token-value'
const prompt = 'planted prompt: deploy the reactor'

describe('logger', () => {
  it('writes one JSON line with the level, the time, the message and the fields', () => {
    const { log, lines } = memoryLogger()
    log.info('request', { requestId: 'r1', status: 200 })
    const [entry, ...more] = lines()
    expect(more).toEqual([])
    const { time, ...rest } = entry ?? {}
    expect(typeof time).toBe('string')
    expect(rest).toEqual({ level: 30, msg: 'request', requestId: 'r1', status: 200 })
  })

  it('keeps planted prompt text, tokens and Tailscale logins out of the fields', () => {
    const { log, lines } = memoryLogger()
    log.warn('request', {
      prompt,
      token,
      login: 'owner@example.com',
      chat: { transcript: prompt, token },
      req: { headers: { 'tailscale-user-login': 'owner@example.com' } },
    })
    const text = JSON.stringify(lines())
    expect(text).not.toContain(token)
    expect(text).not.toContain(prompt)
    expect(text).not.toContain('owner@example.com')
  })

  it('keeps a secret out at any depth: in an error cause, a request header and a child binding', () => {
    const { log, lines } = memoryLogger()
    const cause = Object.assign(new Error('inner'), { token, prompt })
    log.child({ chat: { prompt } }).error('server error', {
      err: new Error('outer', { cause }),
      req: { headers: { authorization: `Bearer ${token}`, 'Tailscale-User-Login': 'owner@example.com' } },
    })
    const text = JSON.stringify(lines())
    expect(text).toContain('inner')
    expect(text).not.toContain(token)
    expect(text).not.toContain(prompt)
    expect(text).not.toContain('owner@example.com')
  })

  it("leaves out a field or child binding named as one of pino's own keys, so no key is written twice", () => {
    const { log, text } = memoryLogger()
    log.child({ msg: 'child text' }).info('request', { msg: 'field text', level: 99, time: 'then', status: 200 })
    expect(text().match(/"msg":/g)).toHaveLength(1)
    expect(text().match(/"level":/g)).toHaveLength(1)
    expect(text().match(/"time":/g)).toHaveLength(1)
    expect(text()).not.toContain('field text')
    expect(text()).not.toContain('child text')
  })

  it('replaces a message that is not listed, so a token planted in a message is not written', () => {
    const { pino, lines } = memoryLogger()
    pino.info({ requestId: 'r2' }, `token ${token}`)
    pino.error(`prompt ${prompt}`)
    const text = JSON.stringify(lines())
    expect(text).not.toContain(token)
    expect(text).not.toContain(prompt)
    expect(lines().map((e) => [e.msg, e.requestId])).toEqual([
      ['log message not listed', 'r2'],
      ['log message not listed', undefined],
    ])
  })

  it('takes only a listed message in its type', () => {
    expectTypeOf<'request'>().toExtend<LogMessage>()
    expectTypeOf<`token ${string}`>().not.toExtend<LogMessage>()
    expectTypeOf<string>().not.toExtend<LogMessage>()
  })

  it('writes an error with its stack and its causes', () => {
    const { log, lines } = memoryLogger()
    log.error('server error', { err: new Error('outer', { cause: new Error('inner') }) })
    const text = JSON.stringify(lines()[0]?.err)
    expect(text).toContain('outer')
    expect(text).toContain('inner')
    expect(text).toContain('"stack"')
  })

  it('writes one file for each day and keeps the newest ones', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bridge-logs-'))
    writeFileSync(join(dir, 'bridge-2026-11-01.log'), '')
    writeFileSync(join(dir, 'bridge-2026-11-02.log'), '')
    writeFileSync(join(dir, 'notes.txt'), '')
    let now = new Date('2026-11-18T23:59:00Z')
    const sink = dailyFiles(dir, 2, () => now)
    sink.write('a\n')
    now = new Date('2026-11-19T00:01:00Z')
    sink.write('b\n')
    expect(readdirSync(dir).sort()).toEqual(['bridge-2026-11-18.log', 'bridge-2026-11-19.log', 'notes.txt'])
    expect(readFileSync(join(dir, 'bridge-2026-11-19.log'), 'utf8')).toBe('b\n')
  })
})
