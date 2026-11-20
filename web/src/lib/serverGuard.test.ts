import { describe, expect, it } from 'vitest'
import { serverReadError } from './serverGuard.ts'

const origin = 'http://localhost:63315'

describe('serverReadError', () => {
  it('stops a read of the API on the page origin, with a relative or a full URL', () => {
    expect(serverReadError('/api/workspaces', origin)?.message).toContain('/api/workspaces')
    expect(serverReadError(`${origin}/api/events?x=1`, origin)?.message).toContain('vi.stubGlobal')
    expect(serverReadError('/api', origin)).toBeInstanceOf(Error)
  })

  it('allows other paths and other origins', () => {
    expect(serverReadError('/src/index.css', origin)).toBeUndefined()
    expect(serverReadError('/apiary', origin)).toBeUndefined()
    expect(serverReadError('https://example.com/api/workspaces', origin)).toBeUndefined()
  })
})
