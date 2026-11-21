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
  BRIDGE_LOG_DIR: '/tmp/bridge-logs',
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
        claudeSettings: '/tmp/settings.json',
        chatRoot: '/tmp',
        logDir: '/tmp/bridge-logs',
        logLevel: 'info',
        pushSubject: 'https://github.com/eshelton328/the-bridge',
      },
    })
  })

  it('takes the Claude settings file from BRIDGE_CLAUDE_SETTINGS when it is set', () => {
    const read = readConfig({ ...env, BRIDGE_CLAUDE_SETTINGS: '/home/dev/.claude/settings.json' })
    expect(read.ok ? read.value.claudeSettings : undefined).toBe('/home/dev/.claude/settings.json')
  })

  it('takes the chat root from BRIDGE_CHAT_ROOT, else the parent of the brain folder', () => {
    const read = readConfig({ ...env, BRIDGE_CHAT_ROOT: '/home/dev/ncc-1701' })
    expect(read.ok ? read.value.chatRoot : undefined).toBe('/home/dev/ncc-1701')
    expect(readConfig({ ...env, BRIDGE_CHAT_ROOT: 'relative/folder' }).ok).toBe(false)
  })

  it('takes the push contact from BRIDGE_PUSH_SUBJECT, a mailto: or https:// URL only', () => {
    const read = readConfig({ ...env, BRIDGE_PUSH_SUBJECT: 'https://example.com/the-bridge' })
    expect(read.ok ? read.value.pushSubject : undefined).toBe('https://example.com/the-bridge')
    expect(readConfig({ ...env, BRIDGE_PUSH_SUBJECT: 'owner@example.com' }).ok).toBe(false)
  })

  it('takes the log level from BRIDGE_LOG_LEVEL and refuses an unknown one', () => {
    const debug = readConfig({ ...env, BRIDGE_LOG_LEVEL: 'debug' })
    expect(debug.ok ? debug.value.logLevel : undefined).toBe('debug')
    expect(readConfig({ ...env, BRIDGE_LOG_LEVEL: 'loud' }).ok).toBe(false)
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
