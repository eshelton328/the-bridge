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
    expect(errorStatus['chat-not-ready']).toBe(409)
    expect(errorStatus['project-not-ready']).toBe(409)
    expect(errorStatus['brain-busy']).toBe(503)
  })

  it("reads a chat-not-ready body only with the chat's state", () => {
    const body = { error: { kind: 'chat-not-ready', state: 'notWorking', message: 'm', requestId: 'r' } }
    expect(ErrorBody.parse(body)).toEqual(body)
    const full = { error: { ...body.error, state: 'inputNotEmpty' } }
    expect(ErrorBody.parse(full)).toEqual(full)
    expect(ErrorBody.safeParse({ error: { ...body.error, state: 'busy' } }).success).toBe(false)
  })
})
