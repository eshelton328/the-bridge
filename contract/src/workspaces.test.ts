import { describe, expect, it } from 'vitest'
import { ChatSummary, WorkspacesResponse } from './workspaces.ts'

const chat = {
  id: 'mac-mini/5af4ed88',
  kind: 'claude',
  title: 'bridge themes',
  model: 'claude-opus-5-5',
  modelId: 'opus',
  effort: 'high',
  contextUsed: 0.42,
  status: 'working',
  parent: null,
  pane: 'mac-mini/3f9a0c',
}

describe('workspaces', () => {
  it('parses a chat summary', () => {
    expect(ChatSummary.parse(chat)).toEqual(chat)
  })

  it('takes a chat with no model or context and a parent', () => {
    const child = {
      ...chat,
      model: null,
      modelId: null,
      effort: null,
      contextUsed: null,
      parent: { id: 'mac-mini/1', relation: 'subtask' },
    }
    expect(ChatSummary.parse(child)).toEqual(child)
  })

  it('refuses a context share above 1, an unknown status and a chat ID without its machine', () => {
    expect(ChatSummary.safeParse({ ...chat, contextUsed: 42 }).success).toBe(false)
    expect(ChatSummary.safeParse({ ...chat, status: 'blocked' }).success).toBe(false)
    expect(ChatSummary.safeParse({ ...chat, id: '5af4ed88' }).success).toBe(false)
  })

  it('refuses an effort or a model family that Claude Code does not name, and a pane without its machine', () => {
    expect(ChatSummary.safeParse({ ...chat, effort: 'extreme' }).success).toBe(false)
    expect(ChatSummary.safeParse({ ...chat, modelId: 'claude-opus-5-5' }).success).toBe(false)
    expect(ChatSummary.safeParse({ ...chat, pane: '3f9a0c' }).success).toBe(false)
  })

  it('parses a response with its workspaces and chats', () => {
    const response = {
      machine: 'mac-mini',
      workspaces: [{ id: 'mac-mini/w17', label: 'the-bridge loops', chats: [chat] }],
    }
    expect(WorkspacesResponse.parse(response)).toEqual(response)
    expect(WorkspacesResponse.safeParse({ ...response, machine: 'Mac Mini' }).success).toBe(false)
  })
})
