import { describe, expect, it } from 'vitest'
import { RestartModelRequest, RestartModelResponse, StartChatRequest } from './newChats.ts'

const place = { in: 'tab', workspace: 'test-mac/w1' }

describe('a start request', () => {
  it('takes a Claude chat with a name, a model alias and a place', () => {
    expect(StartChatRequest.safeParse({ kind: 'claude', name: 'w3-test_1', model: 'sonnet', place }).success).toBe(true)
    const split = { in: 'split', beside: 'test-mac/session-a', direction: 'row' }
    expect(StartChatRequest.safeParse({ kind: 'claude', place: split }).success).toBe(true)
  })

  it('takes a project place by its slug only: no path, no tags and no first message (NCC-129)', () => {
    const project = { in: 'project', project: 'example-project' }
    expect(StartChatRequest.safeParse({ kind: 'claude', place: project }).success).toBe(true)
    for (const body of [
      { kind: 'claude', place: { in: 'project', project: '/home/dev/ncc-1701/projects/example-project' } },
      { kind: 'claude', place: { in: 'project', project: '../example-project' } },
      { kind: 'claude', place: { ...project, cwd: '/home/dev' } },
      { kind: 'claude', place: project, tags: { project: 'example-project' } },
      { kind: 'claude', place: project, text: 'hello' },
    ])
      expect(StartChatRequest.safeParse(body).success).toBe(false)
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

describe('a model restart', () => {
  const confirm = 'test-mac/session-a'
  const session = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'

  it('takes a model alias and the chat ID as its confirm, and nothing else', () => {
    expect(RestartModelRequest.safeParse({ model: 'opus', confirm }).success).toBe(true)
    for (const body of [
      { model: 'opus' },
      { model: 'opus --dangerously-skip-permissions', confirm },
      { model: 'opus', confirm, args: ['--chrome'] },
    ])
      expect(RestartModelRequest.safeParse(body).success).toBe(false)
  })

  it('answers a state and the chat, or failed and the session to resume', () => {
    expect(RestartModelResponse.safeParse({ state: 'ready', chat: confirm }).success).toBe(true)
    expect(RestartModelResponse.safeParse({ state: 'failed', session }).success).toBe(true)
    expect(RestartModelResponse.safeParse({ state: 'failed', session: 'x; rm -rf /' }).success).toBe(false)
    expect(RestartModelResponse.safeParse({ state: 'failed', chat: confirm }).success).toBe(false)
  })
})
