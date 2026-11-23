import { describe, expect, it } from 'vitest'
import {
  ChatOrderRequest,
  CloseWorkspaceRequest,
  ForkChatRequest,
  MoveToWorkspaceRequest,
  MoveToWorkspaceResponse,
  RenameChatRequest,
  RenameWorkspaceRequest,
  WorkspaceOrderRequest,
} from './workspaceEdits.ts'

const bell = String.fromCharCode(7)

describe('the workspace edit contract', () => {
  it('trims a name and refuses an empty one, a long one and a control character', () => {
    expect(RenameWorkspaceRequest.parse({ name: '  theme explorations ' })).toEqual({ name: 'theme explorations' })
    expect(RenameWorkspaceRequest.safeParse({ name: '   ' }).success).toBe(false)
    expect(RenameWorkspaceRequest.safeParse({ name: 'x'.repeat(65) }).success).toBe(false)
    expect(RenameChatRequest.safeParse({ name: `drift${bell}check` }).success).toBe(false)
    expect(RenameChatRequest.safeParse({ name: 'drift-check', path: '/home/dev' }).success).toBe(false)
  })

  it('asks a close for the workspace ID and the number of chats the page listed', () => {
    expect(CloseWorkspaceRequest.safeParse({ confirm: 'test-mac/w1', panes: 3 }).success).toBe(true)
    expect(CloseWorkspaceRequest.safeParse({ confirm: 'test-mac/w1' }).success).toBe(false)
    expect(CloseWorkspaceRequest.safeParse({ confirm: 'test-mac/w1', panes: 0 }).success).toBe(false)
  })

  it('takes an order that names each item once', () => {
    expect(WorkspaceOrderRequest.safeParse({ workspaces: ['test-mac/w2', 'test-mac/w1'] }).success).toBe(true)
    expect(WorkspaceOrderRequest.safeParse({ workspaces: ['test-mac/w1', 'test-mac/w1'] }).success).toBe(false)
    expect(ChatOrderRequest.safeParse({ chats: ['test-mac/a', 'test-mac/b'] }).success).toBe(true)
    expect(ChatOrderRequest.safeParse({ chats: [] }).success).toBe(false)
  })

  it('moves a chat to a workspace and answers with its old and new pane and whether its workspace closed', () => {
    expect(MoveToWorkspaceRequest.safeParse({ workspace: 'test-mac/w2' }).success).toBe(true)
    expect(MoveToWorkspaceRequest.safeParse({ workspace: 'test-mac/w2', tab: 'test-mac/w2:t1' }).success).toBe(false)
    const moved = { chat: 'test-mac/a', pane: { from: 'test-mac/p1', to: 'test-mac/p9' }, sourceClosed: true }
    expect(MoveToWorkspaceResponse.safeParse(moved).success).toBe(true)
    expect(MoveToWorkspaceResponse.safeParse({ chat: moved.chat, pane: moved.pane }).success).toBe(false)
  })

  it('forks with an optional herdr name, never a session or a flag', () => {
    expect(ForkChatRequest.safeParse({}).success).toBe(true)
    expect(ForkChatRequest.safeParse({ name: 'drift-check-fork', direction: 'row' }).success).toBe(true)
    expect(ForkChatRequest.safeParse({ name: 'Drift check' }).success).toBe(false)
    expect(ForkChatRequest.safeParse({ session: '5af4ed88-2e47-4bbb-aafa-f5206af29daf' }).success).toBe(false)
  })
})
