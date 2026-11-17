import { describe, expect, expectTypeOf, it } from 'vitest'
import { err, ok, type Result } from './result.ts'

const parsePort = (text: string): Result<number, 'not-a-number'> => {
  const n = Number(text)
  return Number.isInteger(n) ? ok(n) : err('not-a-number')
}

describe('Result', () => {
  it('holds the value of a success', () => {
    const result = parsePort('8080')
    expect(result).toEqual({ ok: true, value: 8080 })
  })

  it('holds the error of a failure', () => {
    expect(parsePort('eighty')).toEqual({ ok: false, error: 'not-a-number' })
  })

  it('narrows on ok', () => {
    const result = parsePort('1')
    if (result.ok) expectTypeOf(result.value).toEqualTypeOf<number>()
    else expectTypeOf(result.error).toEqualTypeOf<'not-a-number'>()
  })
})
