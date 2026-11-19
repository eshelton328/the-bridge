// The E2E stack starts whatever log level the caller's shell sets, as the
// start waits for the server's info line "server started".
import { afterAll, describe, expect, it } from 'vitest'
import { startStack, stopStack } from './stack.ts'

afterAll(() => {
  delete process.env.BRIDGE_LOG_LEVEL
  stopStack()
})

describe('the E2E stack', () => {
  it('starts when the shell sets BRIDGE_LOG_LEVEL=warn', async () => {
    process.env.BRIDGE_LOG_LEVEL = 'warn'
    const { webPort } = await startStack()
    expect(webPort).toBeGreaterThan(0)
  })
})
