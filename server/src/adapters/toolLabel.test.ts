import { describe, expect, it } from 'vitest'
import { toolLabel } from './toolLabel.ts'

describe('tool label', () => {
  it("gives a known tool its kind and title, and the call's description as the label", () => {
    expect(toolLabel('Bash', { command: 'pnpm test -- marker-5150', description: 'Run the server tests' })).toEqual({
      kind: 'shell',
      title: 'Ran a command',
      label: 'Run the server tests',
    })
    expect(toolLabel('Read', { file_path: '/home/dev/repo/a.ts' })).toEqual({
      kind: 'read',
      title: 'Read a file',
      label: '',
    })
    expect(toolLabel('SendMessage', { to: 'peer', message: 'marker-5150' })).toEqual({
      kind: 'message',
      title: 'Sent a message',
      label: '',
    })
  })

  it('makes a title from the name of an unknown tool or an MCP tool', () => {
    expect(toolLabel('ScheduleWakeup', {})).toMatchObject({ kind: 'other', title: 'Schedule wakeup' })
    expect(toolLabel('mcp__claude-in-chrome__navigate_page', {})).toMatchObject({
      kind: 'mcp',
      title: 'claude-in-chrome: navigate page',
    })
  })

  it('keeps the label to one line of 120 characters with no control character, and reads no other field', () => {
    const bell = String.fromCharCode(7)
    const { label } = toolLabel('Bash', { description: `Run ${bell}the tests\nsecond line marker-5150` })
    expect(label).toBe('Run the tests')
    expect(toolLabel('Agent', { description: 'x'.repeat(200) }).label).toHaveLength(120)
    expect(toolLabel('Bash', { description: 5, command: 'echo marker-5150' }).label).toBe('')
    expect(toolLabel('Bash', 'not an object').label).toBe('')
  })
})
