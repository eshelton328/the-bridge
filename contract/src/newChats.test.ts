import { describe, expect, it } from 'vitest'
import { StartChatRequest } from './newChats.ts'

const place = { in: 'tab', workspace: 'test-mac/w1' }

describe('a start request', () => {
  it('takes a Claude chat with a name, a model alias and a place', () => {
    expect(StartChatRequest.safeParse({ kind: 'claude', name: 'w3-test_1', model: 'sonnet', place }).success).toBe(true)
    const split = { in: 'split', beside: 'test-mac/session-a', direction: 'row' }
    expect(StartChatRequest.safeParse({ kind: 'claude', place: split }).success).toBe(true)
  })

  it('refuses a name or a model with a space or a quote, a flag, another kind and an extra field', () => {
    for (const body of [
      { kind: 'claude', name: 'my chat', place },
      { kind: 'claude', name: "it's", place },
      { kind: 'claude', name: '--dangerously-skip-permissions', place },
      { kind: 'claude', model: 'sonnet --dangerously-skip-permissions', place },
      { kind: 'claude', model: '"opus"', place },
      { kind: 'codex', place },
      { kind: 'claude', place, args: ['--dangerously-skip-permissions'] },
      { kind: 'claude', place: { ...place, cwd: '/home/dev' } },
    ])
      expect(StartChatRequest.safeParse(body).success).toBe(false)
  })
})
