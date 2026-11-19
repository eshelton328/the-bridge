import { describe, expect, expectTypeOf, it } from 'vitest'
import { ChatId, MachineId, splitId, WorkspaceId } from './ids.ts'

describe('ids', () => {
  it('parses a machine ID and refuses one with a slash or a capital', () => {
    expect(MachineId.parse('mac-mini')).toBe('mac-mini')
    expect(MachineId.safeParse('mac/mini').success).toBe(false)
    expect(MachineId.safeParse('Mac').success).toBe(false)
  })

  it('needs the machine ID in a workspace or chat ID', () => {
    expect(WorkspaceId.parse('mac-mini/w17')).toBe('mac-mini/w17')
    expect(ChatId.parse('mac-mini/5af4ed88-2e47')).toBe('mac-mini/5af4ed88-2e47')
    expect(ChatId.safeParse('5af4ed88').success).toBe(false)
    expect(ChatId.safeParse('mac-mini/').success).toBe(false)
    expect(ChatId.safeParse('mac-mini/a/b').success).toBe(false)
    expect(ChatId.safeParse('mac-mini/a b').success).toBe(false)
  })

  it('splits an ID into its machine and local part', () => {
    expect(splitId(ChatId.parse('mac-mini/term_66:a'))).toEqual({ machine: 'mac-mini', local: 'term_66:a' })
  })

  it('keeps the kinds of ID apart', () => {
    expectTypeOf(ChatId.parse('m/a')).not.toEqualTypeOf<WorkspaceId>()
    expectTypeOf<string>().not.toExtend<ChatId>()
  })
})
