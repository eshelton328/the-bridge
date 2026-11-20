import { describe, expect, it } from 'vitest'
import { viewportChangeError } from './viewportGuard.ts'

describe('viewportChangeError', () => {
  it('stops a resize after a passed test body while a view is still mounted', () => {
    expect(viewportChangeError('pass', 1)?.message).toContain('unmountRendered()')
  })

  it('allows a resize in the test body, with nothing mounted, or after a failed test', () => {
    expect(viewportChangeError('run', 2)).toBeUndefined()
    expect(viewportChangeError('pass', 0)).toBeUndefined()
    expect(viewportChangeError('fail', 1)).toBeUndefined()
    expect(viewportChangeError(undefined, 1)).toBeUndefined()
  })
})
