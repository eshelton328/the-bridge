import { describe, expect, expectTypeOf, it } from 'vitest'
import { ErrorBody, type ErrorKind, errorStatus } from './errors.ts'

describe('error bodies', () => {
  it('reads each kind with its own fields', () => {
    const body = { error: { kind: 'not-found', path: '/api/nothing', message: 'no such path', requestId: 'r1' } }
    expect(ErrorBody.parse(body)).toEqual(body)
  })

  it('refuses a kind without its fields, an unknown kind and a body with no request ID', () => {
    expect(ErrorBody.safeParse({ error: { kind: 'not-found', message: 'm', requestId: 'r' } }).success).toBe(false)
    expect(ErrorBody.safeParse({ error: { kind: 'teapot', message: 'm', requestId: 'r' } }).success).toBe(false)
    expect(ErrorBody.safeParse({ error: { kind: 'internal', message: 'm' } }).success).toBe(false)
  })

  it('gives each kind a status, and only the kinds of the union', () => {
    expectTypeOf<keyof typeof errorStatus>().toEqualTypeOf<ErrorKind['kind']>()
    expect(errorStatus['herdr-unavailable']).toBe(503)
    expect(errorStatus['too-many-requests']).toBe(429)
  })
})
