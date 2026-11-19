import { describe, expect, expectTypeOf, it } from 'vitest'
import { AppError, toAppError } from './appError.ts'

type Kind = 'internal' | 'not-found'
const isKind = (kind: string): kind is Kind => kind === 'internal' || kind === 'not-found'

describe('toAppError', () => {
  it("keeps an AppError's kind when the caller has that kind", () => {
    const e = toAppError(new AppError('not-found', 'no such chat'), isKind, 'internal')
    expect([e.kind, e.message]).toEqual(['not-found', 'no such chat'])
    expectTypeOf(e.kind).toEqualTypeOf<Kind>()
  })

  it('gives the fallback kind to anything else, with the value as the cause', () => {
    const thrown = new TypeError('x is undefined')
    const e = toAppError(thrown, isKind, 'internal')
    expect([e.kind, e.message, e.cause]).toEqual(['internal', 'x is undefined', thrown])
    expect(toAppError(new AppError('teapot', 'short'), isKind, 'internal').kind).toBe('internal')
    expect(toAppError({ code: 1 }, isKind, 'internal').cause).toEqual({ code: 1 })
  })
})
