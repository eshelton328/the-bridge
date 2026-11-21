import { describe, expect, it } from 'vitest'
import type { ChatEntry } from '../types.ts'
import { type KindedTool, toolSummary, transcriptItems } from './toolGroups.ts'

const call = (kind: KindedTool['kind'], name = 'Tool'): KindedTool => ({
  type: 'tool',
  name,
  target: '',
  kind,
  title: 'Used a tool',
  label: '',
})
const text: ChatEntry = { type: 'user', text: 'go' }
const old: ChatEntry = { type: 'tool', name: 'Bash', target: 'pnpm' }

describe('tool groups (R32)', () => {
  it('groups each run of two or more kinded calls, keeps a run of one and never groups a call without a kind', () => {
    const one = call('shell')
    const items = transcriptItems([text, one, text, call('read'), call('edit'), text, old, old, call('web')])
    expect(items.map((item) => [item.type, item.index])).toEqual([
      ['entry', 0],
      ['entry', 1],
      ['entry', 2],
      ['tools', 3],
      ['entry', 5],
      ['entry', 6],
      ['entry', 7],
      ['entry', 8],
    ])
    expect(items[1]).toEqual({ type: 'entry', index: 1, entry: one })
  })

  it('sums the kinds in the order they came, with each kind its own words and plural', () => {
    const calls = [call('shell'), call('read'), call('shell'), call('edit'), call('shell'), call('read')]
    expect(toolSummary(calls)).toBe('Ran 3 commands, read 2 files, edited 1 file')
    expect(toolSummary([call('message'), call('message')])).toBe('Sent 2 messages')
    expect(toolSummary([call('search'), call('web'), call('agent'), call('plan')])).toBe(
      'Made 1 search, made 1 web request, started 1 agent, made 1 plan update',
    )
  })

  it('counts MCP and other tools together as tools', () => {
    expect(toolSummary([call('mcp'), call('other'), call('read')])).toBe('Used 2 tools, read 1 file')
    expect(toolSummary([call('other')])).toBe('Used 1 tool')
  })
})
