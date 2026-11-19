import { describe, expect, it } from 'vitest'
import { readConfig } from './config.ts'

const env = {
  BRIDGE_PORT: '5181',
  BRIDGE_MACHINE_ID: 'mac-mini',
  BRIDGE_OWNER_LOGIN: 'owner@example.com',
  BRIDGE_HERDR_SOCKET: '/tmp/herdr.sock',
  BRIDGE_BRAIN_DIR: '/tmp/brain',
  BRIDGE_DB_FILE: '/tmp/bridge.db',
  BRIDGE_CLAUDE_PROJECTS: '/tmp/claude',
}

describe('config', () => {
  it('reads every path and port from the environment', () => {
    expect(readConfig(env)).toEqual({
      ok: true,
      value: {
        port: 5181,
        machine: 'mac-mini',
        owner: 'owner@example.com',
        herdrSocket: '/tmp/herdr.sock',
        brainDir: '/tmp/brain',
        dbFile: '/tmp/bridge.db',
        claudeProjects: '/tmp/claude',
      },
    })
  })

  it('names each variable that is missing or wrong', () => {
    const read = readConfig({
      ...env,
      BRIDGE_PORT: 'eighty',
      BRIDGE_DB_FILE: 'bridge.db',
      BRIDGE_HERDR_SOCKET: undefined,
    })
    expect(read.ok).toBe(false)
    const lines = read.ok ? [] : read.error
    expect(lines).toHaveLength(3)
    expect(lines.join('\n')).toMatch(/BRIDGE_PORT/)
    expect(lines.join('\n')).toMatch(/BRIDGE_DB_FILE: must be an absolute path/)
    expect(lines.join('\n')).toMatch(/BRIDGE_HERDR_SOCKET/)
  })
})
