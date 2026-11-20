import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Runs a Node process that installs the handlers and then fails with `failure`; gives its exit code and log. */
function crash(failure: string): { readonly status: number | null; readonly log: string } {
  const dir = mkdtempSync(join(tmpdir(), 'bridge-crash-'))
  const here = import.meta.dirname
  const code = [
    `import { createLogger, dailyFiles } from ${JSON.stringify(join(here, 'logger.ts'))}`,
    `import { handleProcessErrors } from ${JSON.stringify(join(here, 'processErrors.ts'))}`,
    `handleProcessErrors(process, createLogger(dailyFiles(${JSON.stringify(dir)}), 'info'))`,
    failure,
  ].join('\n')
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8' })
  const files = readdirSync(dir)
  return { status: run.status, log: files.map((f) => readFileSync(join(dir, f), 'utf8')).join('') }
}

describe('process errors', () => {
  it('logs an uncaught exception at fatal and exits with code 1', () => {
    const { status, log } = crash("setTimeout(() => { throw new Error('boom') }, 0)")
    expect(status).toBe(1)
    expect(JSON.parse(log)).toMatchObject({ level: 60, msg: 'uncaught exception', err: { message: 'boom' } })
  })

  it('logs an unhandled rejection at fatal and exits with code 1', () => {
    const { status, log } = crash("void Promise.reject(new Error('lost'))")
    expect(status).toBe(1)
    expect(JSON.parse(log)).toMatchObject({ level: 60, msg: 'unhandled rejection', err: { message: 'lost' } })
  })
})
