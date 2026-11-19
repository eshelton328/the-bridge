import { describe, expect, it } from 'vitest'
import { copyText } from './copyText.ts'

// copyText says what happened (audit W-6): ok, 'unavailable' without a
// clipboard, 'refused' when the write fails. A refusal that is not the
// browser's NotAllowedError goes to the reporter it is given.

/** A reporter that keeps what it gets. */
function spyReport(): { report: (error: unknown) => void; reported: unknown[] } {
  const reported: unknown[] = []
  return { report: (error) => reported.push(error), reported }
}

describe('copyText', () => {
  it('writes the text and gives ok when the page has a clipboard', async () => {
    const written: string[] = []
    const { report, reported } = spyReport()
    const result = await copyText('toolkit/skills/writer/', {
      report,
      clipboard: {
        writeText: (text) => {
          written.push(text)
          return Promise.resolve()
        },
      },
    })
    expect(result).toEqual({ ok: true, value: undefined })
    expect(written).toEqual(['toolkit/skills/writer/'])
    expect(reported).toEqual([])
  })

  it('gives unavailable without a clipboard, and reports nothing', async () => {
    const { report, reported } = spyReport()
    const result = await copyText('toolkit/rules/skills.md', { report, clipboard: null })
    expect(result).toEqual({ ok: false, error: 'unavailable' })
    expect(reported).toEqual([])
  })

  it('gives refused when the write rejects, and reports an error that is not NotAllowedError', async () => {
    const { report, reported } = spyReport()
    const broken = new Error('the clipboard broke')
    const result = await copyText('b', { report, clipboard: { writeText: () => Promise.reject(broken) } })
    expect(result).toEqual({ ok: false, error: 'refused' })
    expect(reported).toEqual([broken])
  })

  it('gives refused when the write throws at once, and reports it', async () => {
    const { report, reported } = spyReport()
    const broken = new TypeError('no write')
    const result = await copyText('a', {
      report,
      clipboard: {
        writeText: () => {
          throw broken
        },
      },
    })
    expect(result).toEqual({ ok: false, error: 'refused' })
    expect(reported).toEqual([broken])
  })

  it('gives refused for NotAllowedError without a report: the browser said no, nothing broke', async () => {
    const { report, reported } = spyReport()
    const denied = new DOMException('Write permission denied.', 'NotAllowedError')
    const result = await copyText('c', { report, clipboard: { writeText: () => Promise.reject(denied) } })
    expect(result).toEqual({ ok: false, error: 'refused' })
    expect(reported).toEqual([])
  })
})
